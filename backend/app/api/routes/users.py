from fastapi import APIRouter, Depends
from typing import List
from app.schemas.schemas import UserResponse
from app.models.models import User, UserRole
from app.crud.crud import UserCRUD
from app.api.deps import get_current_user, require_role
from app.core.config import settings

router = APIRouter(prefix=f"{settings.API_V1_STR}/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=List[UserResponse])
async def get_all_users(
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    return await UserCRUD.get_all()
