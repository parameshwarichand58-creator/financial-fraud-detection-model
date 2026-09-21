from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core import hash_password, make_token, verify_password
from app.db import get_db
from app.deps import current_user
from app.models import User
from app.schemas import LoginIn, RegisterIn, TokenOut, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == payload.email.lower())):
        raise HTTPException(409, "Email already registered")
    u = User(
        email=payload.email.lower(),
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
        role="ANALYST",
    )
    db.add(u); db.commit(); db.refresh(u)
    return u


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    u = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not u or not verify_password(payload.password, u.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    return TokenOut(access_token=make_token(str(u.id), {"role": u.role}))


@router.post("/logout")
def logout(_: User = Depends(current_user)):
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def me(u: User = Depends(current_user)):
    return u
