from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: int
    transaction_id: int | None
    severity: str
    category: str
    reason: str
    status: str
    assigned_to: int | None
    created_at: datetime
    class Config:
        from_attributes = True


class AlertPatch(BaseModel):
    status: str | None = None
    assigned_to: int | None = None


class CaseCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str | None = None
    priority: str = "medium"
    transaction_id: int | None = None


class CasePatch(BaseModel):
    status: str | None = None
    priority: str | None = None
    assigned_to: int | None = None


class CaseNoteIn(BaseModel):
    message: str = Field(min_length=1, max_length=512)


class CaseOut(BaseModel):
    id: int
    title: str
    description: str | None
    priority: str
    status: str
    assigned_to: int | None
    transaction_id: int | None
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True


class CaseEventOut(BaseModel):
    id: int
    case_id: int
    event_type: str
    message: str
    created_at: datetime
    class Config:
        from_attributes = True
