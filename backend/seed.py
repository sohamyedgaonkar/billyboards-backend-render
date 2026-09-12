import json
from database import SessionLocal, engine, Base
from models import User, Location, Campaign
import os

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create dummy user
    if not db.query(User).filter(User.email == "test@cred.com").first():
        user = User(email="test@cred.com", password="password123", name="Soham")
        db.add(user)
    
    # Create locations (Pune specific)
    locations = [
        { 
          "id": 's1', 
          "type": 'Digital Banner',
          "title": 'FC Road Digital Billboard', 
          "lat": 18.5195, 
          "lng": 73.8375, 
          "price": 500, 
          "footfall": '1.2M/day', 
          "screens": 3,
          "size": '1080x1920',
          "photos": [
            'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=400&q=80',
            'https://images.unsplash.com/photo-1555931818-7fba0b9bdc95?auto=format&fit=crop&w=400&q=80'
          ]
        },
        { 
          "id": 's2', 
          "type": 'Road Banner',
          "title": 'Viman Nagar Transit Hub', 
          "lat": 18.5679, 
          "lng": 73.9143, 
          "price": 300, 
          "footfall": '850K/day', 
          "screens": 1,
          "size": '1920x1080',
          "photos": [
            'https://images.unsplash.com/photo-1596489370002-39bd13dbd2eb?auto=format&fit=crop&w=400&q=80',
            'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=400&q=80'
          ]
        }
    ]

    for loc in locations:
        if not db.query(Location).filter(Location.id == loc["id"]).first():
            db_loc = Location(
                id=loc["id"],
                type=loc["type"],
                title=loc["title"],
                lat=loc["lat"],
                lng=loc["lng"],
                price=loc["price"],
                footfall=loc["footfall"],
                screens=loc["screens"],
                size=loc["size"]
            )
            db_loc.photos = loc["photos"]
            db.add(db_loc)
    
    db.commit()

    # Create dummy campaigns
    user = db.query(User).filter(User.email == "test@cred.com").first()
    if not db.query(Campaign).first():
        c1 = Campaign(user_id=user.id, location_id="s1", title="FC Road Ad", duration_days=7, time_slot="all_day", schedule="10x", total_cost=3500, status="Active", spent=0.7, video_url="")
        c2 = Campaign(user_id=user.id, location_id="s2", title="Viman Nagar Hub", duration_days=30, time_slot="prime", schedule="50x", total_cost=54000, status="Pending", spent=0.2, video_url="")
        db.add_all([c1, c2])
    
    db.commit()
    db.close()
    print("Database seeded successfully!")

if __name__ == "__main__":
    if not os.path.exists("backend/uploads"):
        os.makedirs("backend/uploads")
    init_db()
