from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.enums import UserRole


def require_roles(
    *allowed_roles: UserRole
):
    async def role_checker(
        current_user: Annotated[
            User,
            Depends(get_current_user)
        ]
    ) -> User:

        try:
            user_role = UserRole(
                current_user.role
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid user role"
            )

        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )

        return current_user

    return role_checker


PatientUser = Annotated[
    User,
    Depends(
        require_roles(
            UserRole.PATIENT
        )
    )
]


DoctorUser = Annotated[
    User,
    Depends(
        require_roles(
            UserRole.DOCTOR
        )
    )
]


ReceptionistUser = Annotated[
    User,
    Depends(
        require_roles(
            UserRole.RECEPTIONIST
        )
    )
]


DoctorOrReceptionistUser = Annotated[
    User,
    Depends(
        require_roles(
            UserRole.DOCTOR,
            UserRole.RECEPTIONIST
        )
    )
]