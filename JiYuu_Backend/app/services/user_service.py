from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate


class UserService:

    def __init__(self):
        self.repository = UserRepository()

    async def get_by_id(
        self,
        db: AsyncSession,
        user_id: int
    ) -> User | None:
        return await self.repository.get_by_id(
            db,
            user_id
        )

    async def get_by_email(
        self,
        db: AsyncSession,
        email: str
    ) -> User | None:
        return await self.repository.get_by_email(
            db,
            email
        )

    async def create(
        self,
        db: AsyncSession,
        data: UserCreate
    ) -> User:

        existing_user = await self.repository.get_by_email(
            db,
            data.email
        )

        if existing_user:
            raise ValueError("Email already exists")

        user = User(
            full_name=data.full_name,
            email=data.email,
            password_hash=hash_password(data.password),
            phone=data.phone,
            role="PATIENT",
        )

        return await self.repository.create(
            db,
            user
        )