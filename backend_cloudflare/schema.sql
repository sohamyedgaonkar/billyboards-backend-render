CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    name TEXT,
    business_name TEXT,
    industry TEXT
);

CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT,
    latitude REAL,
    longitude REAL,
    price INTEGER,
    status TEXT,
    photo_urls TEXT -- Stored as comma-separated string or JSON string
);

CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    budget INTEGER,
    spent REAL DEFAULT 0,
    status TEXT DEFAULT 'Active',
    thumbnail TEXT,
    start_date TEXT,
    end_date TEXT,
    user_id INTEGER,
    locations TEXT, -- JSON string
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Insert dummy inventory data
INSERT INTO inventory (title, type, latitude, longitude, price, status, photo_urls) VALUES 
('Times Square Billboard', 'Digital', 40.7580, -73.9855, 5000, 'Available', 'https://images.unsplash.com/photo-1555169062-013468b47731?w=500&q=80'),
('Mumbai Central LED', 'Digital', 18.9696, 72.8193, 2000, 'Available', 'https://images.unsplash.com/photo-1518063319808-1f19dce3ce79?w=500&q=80'),
('London Piccadilly', 'Digital', 51.5101, -0.1340, 4500, 'Available', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=500&q=80');
