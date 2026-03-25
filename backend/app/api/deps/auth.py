from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

from app.core.security import decode_token
from app.crud.crud import UserCRUD
from app.models.models import User, UserRole

security = HTTPBearer()


async def get_current_user(credentials=Depends(security)) -> User:
    token = credentials.credentials
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

        if (
            current_user.role == UserRole.ADMIN
            and UserRole.ADMIN in roles
            and not getattr(current_user, "is_legal_admin_verified", False)
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin is not legally verified",
            )
        return current_user

    return check_role
