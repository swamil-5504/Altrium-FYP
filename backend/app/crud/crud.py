from sqlalchemy.orm import Session
from uuid import UUID
from app.models.models import User, Credential, UserRole, CredentialStatus
from app.schemas.schemas import UserCreate, UserUpdate, CredentialCreate, CredentialUpdate
from app.core.security import hash_password, verify_password

class UserCRUD:
    @staticmethod
    def create(db: Session, user_create: UserCreate):
        hashed_password = hash_password(user_create.password)
        db_user = User(
            email=user_create.email,
            full_name=user_create.full_name,
            hashed_password=hashed_password,
            role=user_create.role
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def get_by_email(db: Session, email: str):
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_by_id(db: Session, user_id: UUID):
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(User).offset(skip).limit(limit).all()
    
    @staticmethod
    def update(db: Session, user_id: UUID, user_update: UserUpdate):
        db_user = UserCRUD.get_by_id(db, user_id)
        if not db_user:
            return None
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_user, field, value)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def authenticate(db: Session, email: str, password: str):
        user = UserCRUD.get_by_email(db, email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

class CredentialCRUD:
    @staticmethod
    def create(db: Session, credential_create: CredentialCreate, issued_by_id: UUID):
        db_credential = Credential(
            title=credential_create.title,
            description=credential_create.description,
            issued_to_id=credential_create.issued_to_id,
            issued_by_id=issued_by_id,
            metadata_json=credential_create.metadata_json
        )
        db.add(db_credential)
        db.commit()
        db.refresh(db_credential)
        return db_credential
    
    @staticmethod
    def get_by_id(db: Session, credential_id: UUID):
        return db.query(Credential).filter(Credential.id == credential_id).first()
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Credential).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_user(db: Session, user_id: UUID):
        return db.query(Credential).filter(Credential.issued_to_id == user_id).all()
    
    @staticmethod
    def update_status(db: Session, credential_id: UUID, status: CredentialStatus):
        db_credential = CredentialCRUD.get_by_id(db, credential_id)
        if not db_credential:
            return None
        db_credential.status = status
        db.add(db_credential)
        db.commit()
        db.refresh(db_credential)
        return db_credential
    
    @staticmethod
    def delete(db: Session, credential_id: UUID):
        db_credential = CredentialCRUD.get_by_id(db, credential_id)
        if db_credential:
            db.delete(db_credential)
            db.commit()
            return True
        return False
