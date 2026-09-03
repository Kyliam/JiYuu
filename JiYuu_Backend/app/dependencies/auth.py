from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings
from app.dependencies.database import DBSession
from app.models.user import User
from app.services.user_service import UserService


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: DBSession,
) -> User:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        },
    )

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except (
        jwt.InvalidTokenError,
        ValueError,
    ):
        raise credentials_exception

    user_service = UserService()

    user = await user_service.get_by_id(
        db,
        user_id
    )

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise credentials_exception

    return user


CurrentUser = Annotated[
    User,
    Depends(get_current_user)
]