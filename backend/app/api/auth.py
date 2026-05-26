from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas import AuthInput, AuthOut, UserOut
from app.services.auth import get_current_user, hash_password, new_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthOut)
def register(body: AuthInput, db: Session = Depends(get_db)):
    username = body.username.strip()
    if not username or not body.password:
        raise HTTPException(status_code=400, detail="Username and password required")
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(
        username=username,
        password_hash=hash_password(body.password),
        token=new_token(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return AuthOut(token=user.token, user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthOut)
def login(body: AuthInput, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username.strip()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not user.token:
        user.token = new_token()
        db.commit()
        db.refresh(user)
    return AuthOut(token=user.token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
