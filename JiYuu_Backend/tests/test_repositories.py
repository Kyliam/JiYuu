import pytest

from app.core.database import AsyncSessionLocal
from app.repositories.user_repository import UserRepository


@pytest.mark.asyncio
async def test_get_user_by_id():
    async with AsyncSessionLocal() as db:
        repository = UserRepository()
        user = await repository.get_by_id(db, 1)

        assert user is None or user.id == 1


@pytest.mark.asyncio
async def test_get_all_users():
    async with AsyncSessionLocal() as db:
        repository = UserRepository()
        users = await repository.get_all(db)

        assert isinstance(users, list)
