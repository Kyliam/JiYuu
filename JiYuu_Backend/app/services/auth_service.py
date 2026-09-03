from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository


class AuthService:

    def __init__(self):
        self.user_repository = UserRepository()

    async def authenticate(
        self,
        db: AsyncSession,
        email: str,
        password: str
    ) -> User | None:

        user = await self.user_repository.get_by_email(
            db,
            email
        )

        if user is None:
            return None

        if not user.is_active:
            return None

        if not verify_password(
            password,
            user.password_hash
        ):
            return None

        return user

    def create_token(self, user: User) -> str:
        return create_access_token(
            user_id=user.id,
            role=user.role
        )