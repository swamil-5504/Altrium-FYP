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

REGISTRY_ABI = [{
    "type": "function",
    "name": "grantRole",
    "inputs": [
        {"name": "role", "type": "bytes32"},
        {"name": "account", "type": "address"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
}]

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
        user.is_legal_admin_verified = True
        from datetime import datetime
        user.updated_at = datetime.utcnow()
        await user.save()
        return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

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
