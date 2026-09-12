from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import shutil
import os
import uuid

import models
from database import SessionLocal, engine
import housekeeping

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(housekeeping.router)

import asyncio
import httpx

@app.on_event("startup")
async def startup_event():
    async def keep_alive():
        while True:
            await asyncio.sleep(600)  # Ping every 10 minutes
            try:
                port = os.environ.get("PORT", "8000")
                async with httpx.AsyncClient() as client:
                    await client.get("https://billyboards-backend.onrender.com/api/inventory")
            except Exception:
                pass
                
    asyncio.create_task(keep_alive())

# Mount static files for uploads
os.makedirs("backend/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Schemas ---
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user_id: int
    id: int
    name: str

# --- Endpoints ---

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    business_name: str = None
    industry: str = None

@app.post("/api/register", response_model=LoginResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == req.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = models.User(
        name=req.name,
        email=req.email,
        password=req.password,
        business_name=req.business_name,
        industry=req.industry
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"token": f"mock_token_{new_user.id}", "user_id": new_user.id, "id": new_user.id, "name": new_user.name}

@app.post("/api/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or user.password != req.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Very basic mock token
    return {"token": f"mock_token_{user.id}", "user_id": user.id, "id": user.id, "name": user.name}

@app.get("/api/inventory")
def get_inventory(db: Session = Depends(get_db)):
    locations = db.query(models.Location).all()
    # Serialize correctly
    res = []
    for loc in locations:
        res.append({
            "id": loc.id,
            "type": loc.type,
            "title": loc.title,
            "lat": loc.lat,
            "lng": loc.lng,
            "price": loc.price,
            "footfall": loc.footfall,
            "screens": loc.screens,
            "size": loc.size,
            "photos": loc.photos
        })
    return res

@app.get("/api/dashboard")
def get_dashboard(user_id: int = 1, db: Session = Depends(get_db)):
    campaigns = db.query(models.Campaign).filter(models.Campaign.user_id == user_id).all()
    
    if not campaigns:
        return {
            "verified_impressions": 0,
            "total_ad_spend": 0,
            "active_campaigns": [],
            "foot_traffic": [0, 0, 0, 0, 0, 0, 0]
        }
        
    total_spend = sum(c.total_cost * c.spent for c in campaigns)
    verified_impressions = int(total_spend * 10)
    
    base = total_spend / 100
    foot_traffic = [int(base * i) for i in [0.5, 1.2, 0.8, 1.5, 2.0, 1.1, 1.3]]
    if max(foot_traffic) == 0:
        foot_traffic = [0]*7
    
    active_campaigns = []
    for c in campaigns:
        thumbnail = "https://images.unsplash.com/photo-1555169062-0133c8bf6bc1?q=80&w=300&auto=format&fit=crop"
        if c.location_id == "s2":
             thumbnail = "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=300&auto=format&fit=crop"
             
        active_campaigns.append({
            "id": str(c.id),
            "title": c.title,
            "status": c.status,
            "spent": c.spent,
            "thumbnail": thumbnail
        })
        
    return {
        "verified_impressions": verified_impressions,
        "total_ad_spend": int(total_spend),
        "active_campaigns": active_campaigns,
        "foot_traffic": foot_traffic
    }

@app.get("/api/analytics")
def get_analytics(user_id: int = 1, db: Session = Depends(get_db)):
    campaigns = db.query(models.Campaign).filter(models.Campaign.user_id == user_id).all()
    
    if not campaigns:
        return {
            "impressions": [0, 0, 0, 0, 0, 0, 0],
            "locations": [],
            "location_data": [],
            "total_impressions": 0,
            "total_spend": 0
        }
        
    total_spend = sum(c.total_cost * c.spent for c in campaigns)
    total_impressions = int(total_spend * 10)
    
    base = total_impressions / 100
    impressions = [int(base * i) for i in [0.5, 1.2, 0.8, 1.5, 2.0, 1.1, 1.3]]
    if max(impressions) == 0:
        impressions = [0]*7
    
    locations = []
    location_data = []
    for c in campaigns:
        loc = db.query(models.Location).filter(models.Location.id == c.location_id).first()
        loc_name = loc.title if loc else c.location_id
        val = int(c.total_cost * c.spent * 10)
        if loc_name not in locations:
            locations.append(loc_name)
            location_data.append(val)
        else:
            idx = locations.index(loc_name)
            location_data[idx] += val
            
    return {
        "impressions": impressions,
        "locations": locations,
        "location_data": location_data,
        "total_impressions": total_impressions,
        "total_spend": int(total_spend)
    }

@app.get("/api/profile")
def get_profile(user_id: int = 1, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "name": user.name,
        "email": user.email,
        "business_name": user.business_name,
        "industry": user.industry
    }

@app.post("/api/campaigns")
async def create_campaign(
    user_id: int = Form(...),
    location_id: str = Form(...),
    days: int = Form(...),
    time_slot: str = Form(...),
    schedule: str = Form(...),
    total_cost: int = Form(...),
    video: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    video_url = ""
    if video:
        file_ext = video.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = f"backend/uploads/{filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        
        video_url = f"https://billyboards-backend.onrender.com/uploads/{filename}"

    location = db.query(models.Location).filter(models.Location.id == location_id).first()
    title = f"Campaign at {location.title}" if location else "New Campaign"

    new_campaign = models.Campaign(
        user_id=user_id,
        location_id=location_id,
        title=title,
        duration_days=days,
        time_slot=time_slot,
        schedule=schedule,
        total_cost=total_cost,
        status="Pending",
        video_url=video_url,
        spent=0.0
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    
    return {"status": "success", "campaign_id": new_campaign.id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
