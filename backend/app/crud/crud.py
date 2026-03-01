from uuid import UUID
from typing import List, Optional
from datetime import datetime
from app.models.models import User, Credential, UserRole, CredentialStatus
from app.schemas.schemas import UserCreate, UserUpdate, CredentialCreate, CredentialUpdate
from app.core.security import hash_password, verify_password

# all methods are async now because beanie operations are async
class UserCRUD:
    @staticmethod
    async def create(user_create: UserCreate) -> User:
        hashed_password = hash_password(user_create.password)
        user = User(
            email=user_create.email,
            full_name=user_create.full_name,
            hashed_password=hashed_password,
            role=user_create.role,
        )
        await user.insert()
        return user

    @staticmethod
    async def get_by_email(email: str) -> Optional[User]:
        return await User.find_one(User.email == email)

    @staticmethod
    async def get_by_id(user_id: UUID) -> Optional[User]:
        return await User.get(user_id)

    @staticmethod
    async def get_all(skip: int = 0, limit: int = 100) -> List[User]:
        return await User.find_all().skip(skip).limit(limit).to_list()

    @staticmethod
    async def update(user_id: UUID, user_update: UserUpdate) -> Optional[User]:
        user = await UserCRUD.get_by_id(user_id)
        if not user:
            return None
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        user.updated_at = datetime.utcnow()
        await user.save()
        return user

    @staticmethod
    async def authenticate(email: str, password: str) -> Optional[User]:
        user = await UserCRUD.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    async def delete(user_id: UUID) -> bool:
        user = await UserCRUD.get_by_id(user_id)
        if user:
            await user.delete()
            return True
        return False

class CredentialCRUD:
    @staticmethod
    async def create(credential_create: CredentialCreate, issued_by_id: UUID) -> Credential:
        credential = Credential(
            title=credential_create.title,
            description=credential_create.description,
            issued_to_id=credential_create.issued_to_id,
            issued_by_id=issued_by_id,
            metadata_json=credential_create.metadata_json,
        )
        await credential.insert()
        return credential

    @staticmethod
    async def get_by_id(credential_id: UUID) -> Optional[Credential]:
        return await Credential.get(credential_id)

    @staticmethod
    async def get_all(skip: int = 0, limit: int = 100) -> List[Credential]:
        return await Credential.find_all().skip(skip).limit(limit).to_list()

    @staticmethod
    async def get_by_user(user_id: UUID) -> List[Credential]:
        return await Credential.find(Credential.issued_to_id == user_id).to_list()

    @staticmethod
    async def update_status(credential_id: UUID, status: CredentialStatus) -> Optional[Credential]:
        credential = await CredentialCRUD.get_by_id(credential_id)
        if not credential:
            return None
        credential.status = status
        credential.updated_at = datetime.utcnow()
        await credential.save()
        return credential

    @staticmethod
    async def delete(credential_id: UUID) -> bool:
        credential = await CredentialCRUD.get_by_id(credential_id)
        if credential:
            await credential.delete()
            return True
        return False
