from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import models
from database import SessionLocal

router = APIRouter(prefix="/housekeeping", tags=["housekeeping"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Pydantic Schemas ---
class InventoryRequest(BaseModel):
    id: str
    type: str
    title: str
    lat: float
    lng: float
    price: int
    footfall: str
    screens: int
    size: str
    photos: List[str] = []

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    business_name: Optional[str] = None
    industry: Optional[str] = None

# --- Endpoints ---
@router.post("/inventory")
def create_inventory(req: InventoryRequest, db: Session = Depends(get_db)):
    loc = models.Location(
        id=req.id,
        type=req.type,
        title=req.title,
        lat=req.lat,
        lng=req.lng,
        price=req.price,
        footfall=req.footfall,
        screens=req.screens,
        size=req.size
    )
    loc.photos = req.photos
    db.add(loc)
    db.commit()
    return {"status": "success", "id": loc.id}

@router.put("/users/{user_id}")
def update_user(user_id: int, req: UpdateUserRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if req.name is not None:
        user.name = req.name
    if req.email is not None:
        user.email = req.email
    if req.password is not None:
        user.password = req.password
    if req.business_name is not None:
        user.business_name = req.business_name
    if req.industry is not None:
        user.industry = req.industry
        
    db.commit()
    db.refresh(user)
    
    return {"status": "success", "user_id": user.id}
