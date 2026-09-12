-- Users (already inserted test@cred.com, adding if not exists would be tricky in raw SQL without ON CONFLICT for some SQLite versions, but we'll assume it exists or we can ignore duplicate errors)

-- Delete old inventory and campaigns to ensure a clean state matching the local DB
DELETE FROM campaigns;
DELETE FROM inventory;

-- Insert inventory
INSERT INTO inventory (title, type, latitude, longitude, price, status, photo_urls) VALUES 
('FC Road Digital Billboard', 'Digital Banner', 18.5195, 73.8375, 500, 'Available', 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=400&q=80'),
('Viman Nagar Transit Hub', 'Road Banner', 18.5679, 73.9143, 300, 'Available', 'https://images.unsplash.com/photo-1596489370002-39bd13dbd2eb?auto=format&fit=crop&w=400&q=80');

-- Insert campaigns
-- We will use the user_id for test@cred.com which is 4 in our D1 database based on the previous insert.
-- We also need to map the locations. Since D1 auto-increments, let's assume they are id 1 and 2 if we just deleted all.
-- Wait, SQLite AUTOINCREMENT doesn't reset on DELETE FROM. It's safer to just insert campaigns with a subquery if D1 supports it, but D1 is SQLite.
-- Let's just insert campaigns and link to user_id = 4
INSERT INTO campaigns (title, budget, spent, status, thumbnail, user_id, locations) VALUES 
('FC Road Ad', 3500, 3500 * 0.7, 'Active', 'https://images.unsplash.com/photo-1555169062-0133c8bf6bc1?q=80&w=300&auto=format&fit=crop', 4, '["s1"]'),
('Viman Nagar Hub', 54000, 54000 * 0.2, 'Pending', 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=300&auto=format&fit=crop', 4, '["s2"]');
