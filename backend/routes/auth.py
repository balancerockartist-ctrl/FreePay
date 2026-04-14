"""Auth routes — register, login, me."""
from fastapi import APIRouter, Depends, HTTPException, status

from auth import hash_password, verify_password, create_access_token, get_current_user
from config import db
from models import User, UserCreate, UserLogin, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register(body: UserCreate) -> UserPublic:
    existing = await db.users.find_one({"email": body.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        role=body.role,
        spend_limit=body.spend_limit,
    )
    doc = user.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.users.insert_one(doc)
    return UserPublic(**user.model_dump())


@router.post("/login")
async def login(body: UserLogin) -> dict:
    doc = await db.users.find_one({"email": body.email}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = User(**doc)
    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token_data = {"sub": user.id, "role": user.role, "spend_limit": user.spend_limit}
    token = create_access_token(token_data)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserPublic)
async def me(current: User = Depends(get_current_user)) -> UserPublic:
    return UserPublic(**current.model_dump())
