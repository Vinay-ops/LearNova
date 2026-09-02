import uuid
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from .user import UserResponse
from .profile import ProfileResponse


STRONG_PASSWORD_ERR = "Password must be at least 6 characters long"


class AuthSignupRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)

    @field_validator("password")
    @classmethod
    def password_not_blank(cls, v: str) -> str:
        if len(v.strip()) < 6:
            raise ValueError(STRONG_PASSWORD_ERR)
        return v


class AuthLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    profile: Optional[ProfileResponse] = None


class MeResponse(BaseModel):
    user: UserResponse
    profile: Optional[ProfileResponse] = None
