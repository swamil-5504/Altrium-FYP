from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

from app.core.security import decode_token
from app.crud.crud import UserCRUD
from app.models.models import User, UserRole

security = HTTPBearer()


async def get_current_user(credentials=Depends(security)) -> User:
    token = credentials.credentials
    
    # Check if token is blacklisted
    from app.models.models import BlacklistedToken
    is_blacklisted = await BlacklistedToken.find_one({"token": token})
    if is_blacklisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked (logged out)",
        )

    payload = decode_token(token)


    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user = await UserCRUD.get_by_id(UUID(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


def require_role(*roles: UserRole):
    async def check_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
        return current_user

    return check_role


async def require_verified_admin(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN))
) -> User:
    """
    Enforces that an ADMIN must have is_legal_admin_verified=True.
    SUPERADMIN is always considered verified.
    """
    if current_user.role == UserRole.ADMIN and not getattr(current_user, "is_legal_admin_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="University admin account pending legal verification by Superadmin",
        )
    return current_user

