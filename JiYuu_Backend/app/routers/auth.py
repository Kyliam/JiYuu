from fastapi import APIRouter, HTTPException, status

from app.dependencies.database import DBSession
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import AuthService
from app.services.user_service import UserService


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
async def register(
    data: UserCreate,
    db: DBSession,
):
    service = UserService()

    try:
        user = await service.create(
            db,
            data
        )

        await db.commit()

        return user

    except ValueError as e:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/login",
    response_model=TokenResponse
)
async def login(
    data: LoginRequest,
    db: DBSession,
):
    service = AuthService()

    user = await service.authenticate(
        db,
        data.email,
        data.password
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    access_token = service.create_token(user)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer"
    )