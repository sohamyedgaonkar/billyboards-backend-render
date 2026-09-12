from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import json

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    name = Column(String)
    business_name = Column(String, nullable=True)
    industry = Column(String, nullable=True)

class Location(Base):
    __tablename__ = "locations"
    id = Column(String, primary_key=True, index=True)
    type = Column(String)
    title = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    price = Column(Integer)
    footfall = Column(String)
    screens = Column(Integer)
    size = Column(String)
    _photos = Column("photos", String) # Store JSON string of photos

    @property
    def photos(self):
        return json.loads(self._photos) if self._photos else []

    @photos.setter
    def photos(self, value):
        self._photos = json.dumps(value)

class Campaign(Base):
    __tablename__ = "campaigns"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    location_id = Column(String, ForeignKey("locations.id"))
    title = Column(String)
    duration_days = Column(Integer)
    time_slot = Column(String)
    schedule = Column(String)
    total_cost = Column(Integer)
    status = Column(String, default="Pending")
    video_url = Column(String)
    spent = Column(Float, default=0.0)
    
    user = relationship("User")
    location = relationship("Location")
