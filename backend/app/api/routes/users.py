from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
import os
from web3 import Web3
from app.schemas.schemas import UserResponse
from app.models.models import User, UserRole
from app.crud.crud import UserCRUD
from app.api.deps.auth import get_current_user, require_role
from app.core.config import settings

router = APIRouter(prefix=f"{settings.API_V1_STR}/users", tags=["users"])

@router.get("/universities", response_model=List[str])
async def get_registered_universities():
    """Return a unique list of college names from all registered and verified admins."""
    # Find all admins who have a college name set
    admins = await User.find(
        User.role == UserRole.ADMIN,
        User.college_name != None
    ).to_list()
    
    # Get unique college names
    universities = sorted(list(set(admin.college_name for admin in admins if admin.college_name)))
    return universities


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=List[UserResponse])
async def get_all_users(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN))
):
    return await UserCRUD.get_all()

REGISTRY_ABI = [
    {
        "type": "function",
        "name": "addUniversity",
        "inputs": [
            {"name": "universityAdmin", "type": "address"}
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "hasRole",
        "inputs": [
            {"name": "role", "type": "bytes32"},
            {"name": "account", "type": "address"}
        ],
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view"
    }
]

@router.post("/verify-admin/{user_id}", response_model=UserResponse)
async def verify_admin(
    user_id: UUID,
    current_user: User = Depends(require_role(UserRole.SUPERADMIN))
):
    user = await UserCRUD.get_by_id(user_id)
    if not user or user.role != "ADMIN":
        raise HTTPException(status_code=404, detail="Admin not found")
    
    if user.is_legal_admin_verified:
        return user
        
    try:
        # If Web3 environment is configured AND the admin has already connected a wallet,
        # grant the on-chain role via the deploying wallet.
        # If the admin has no wallet yet, we skip the on-chain step — they can connect
        # their wallet later in the admin dashboard before minting degrees.
        if settings.PRIVATE_KEY and settings.CONTRACT_REGISTRY_ADDRESS and user.wallet_address:
            w3 = Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER_URI))
            if w3.is_connected():
                account = w3.eth.account.from_key(settings.PRIVATE_KEY)
                registry_contract = w3.eth.contract(address=settings.CONTRACT_REGISTRY_ADDRESS, abi=REGISTRY_ABI)
                admin_wallet = w3.to_checksum_address(user.wallet_address)
                UNIVERSITY_ROLE = Web3.keccak(text="UNIVERSITY_ROLE")
                
                # Check if they already have the role.
                has_role = registry_contract.functions.hasRole(UNIVERSITY_ROLE, admin_wallet).call()
                if not has_role:
                    tx = registry_contract.functions.grantRole(
                        UNIVERSITY_ROLE, 
                        admin_wallet
                    ).build_transaction({
                        'from': account.address,
                        'nonce': w3.eth.get_transaction_count(account.address),
                        'gas': 200000,
                        'gasPrice': w3.eth.gas_price
                    })
                    signed_tx = w3.eth.account.sign_transaction(tx, private_key=settings.PRIVATE_KEY)
                    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
                    
                    # Wait for transaction confirmation
                    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
                    if receipt.status != 1:
                        raise HTTPException(status_code=500, detail="On-chain role grant transaction failed.")
        
        user.is_legal_admin_verified = True
        from datetime import datetime
        user.updated_at = datetime.utcnow()
        await user.save()
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@router.patch("/me/wallet", response_model=UserResponse)
async def update_wallet_address(
    body: dict,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN))
):
    """
    Saves the admin's wallet address. If already verified, calls addUniversity
    on-chain to grant roles in both Registry and SBT contracts.
    """
    wallet_address = body.get("wallet_address", "").strip()
    if not wallet_address:
        raise HTTPException(status_code=400, detail="wallet_address is required")

    current_user.wallet_address = wallet_address
    from datetime import datetime
    current_user.updated_at = datetime.utcnow()
    await current_user.save()

    if (
        current_user.is_legal_admin_verified
        and settings.PRIVATE_KEY
        and settings.CONTRACT_REGISTRY_ADDRESS
    ):
        try:
            w3 = Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER_URI))
            if w3.is_connected():
                account = w3.eth.account.from_key(settings.PRIVATE_KEY)
                registry_contract = w3.eth.contract(
                    address=settings.CONTRACT_REGISTRY_ADDRESS, abi=REGISTRY_ABI
                )
                admin_wallet = w3.to_checksum_address(wallet_address)
                UNIVERSITY_ROLE = Web3.keccak(text="UNIVERSITY_ROLE")

                has_role = registry_contract.functions.hasRole(UNIVERSITY_ROLE, admin_wallet).call()
                if not has_role:
                    tx = registry_contract.functions.addUniversity(
                        admin_wallet
                    ).build_transaction({
                        'from': account.address,
                        'nonce': w3.eth.get_transaction_count(account.address),
                        'gas': 200000,
                        'gasPrice': w3.eth.gas_price
                    })
                    signed_tx = w3.eth.account.sign_transaction(tx, private_key=settings.PRIVATE_KEY)
                    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
                    w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"addUniversity on-chain failed after wallet save: {e}")

    return current_user

@router.get("/my-students", response_model=List[UserResponse])
async def get_my_students(
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Return all students enrolled in the same college as this admin."""
    if not current_user.college_name:
        return []
    return await User.find(
        User.role == UserRole.STUDENT,
        User.college_name == current_user.college_name
    ).to_list()

@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_role(UserRole.SUPERADMIN))
):
    """Delete a user from the system."""
    user = await UserCRUD.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    success = await UserCRUD.delete(user_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete user")
    return None
