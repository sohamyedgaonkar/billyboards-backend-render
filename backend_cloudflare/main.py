import json
from js import Response, Headers, URL

def cors_headers():
    headers = Headers.new()
    headers.set("Content-Type", "application/json")
    headers.set("Access-Control-Allow-Origin", "*")
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    headers.set("Access-Control-Allow-Headers", "Content-Type")
    return headers

async def on_fetch(request, env):
    # Handle CORS preflight
    if request.method == "OPTIONS":
        return Response.new("", headers=cors_headers())

    url = URL.new(request.url)
    path = url.pathname
    headers = cors_headers()

    try:
        # GET /api/inventory
        if path == "/api/inventory" and request.method == "GET":
            result = await env.DB.prepare("SELECT * FROM inventory").all()
            inventory = []
            if result and result.results:
                for row in result.results:
                    inventory.append({
                        "id": row.id,
                        "title": row.title,
                        "type": row.type,
                        "lat": row.latitude,
                        "lng": row.longitude,
                        "price": row.price,
                        "status": row.status,
                        "photos": [row.photo_urls],
                        "footfall": "50K+",
                        "screens": 2,
                        "size": "1920x1080"
                    })
            return Response.new(json.dumps(inventory), headers=headers)

        # GET /api/dashboard
        if path == "/api/dashboard" and request.method == "GET":
            user_id = url.searchParams.get("user_id") or "1"
            
            # Fetch total spend
            spend_result = await env.DB.prepare("SELECT SUM(spent) as total_spend FROM campaigns WHERE user_id = ?").bind(user_id).first()
            spend = spend_result.total_spend if spend_result and spend_result.total_spend else 0
            
            # Fetch active campaigns
            campaigns_result = await env.DB.prepare("SELECT * FROM campaigns WHERE user_id = ?").bind(user_id).all()
            campaigns = []
            if campaigns_result and campaigns_result.results:
                for row in campaigns_result.results:
                    campaigns.append({
                        "id": str(row.id),
                        "title": row.title,
                        "status": row.status,
                        "spent": (row.spent / row.budget) if row.budget else 0,
                        "thumbnail": row.thumbnail
                    })
            
            data = {
                "verified_impressions": spend * 1000,
                "total_ad_spend": spend,
                "foot_traffic": [0,0,0,0,0,0,0] if spend == 0 else [1000, 1500, 2000, 1200, 3000, 2500, 1800],
                "active_campaigns": campaigns
            }
            return Response.new(json.dumps(data), headers=headers)
            
        # POST /api/register
        if path == "/api/register" and request.method == "POST":
            body = await request.json()
            email = body.email
            password = body.password # raw password for now in mock
            name = body.name
            business_name = body.business_name
            industry = body.industry
            
            # simplistic check
            check = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first()
            if check:
                return Response.new(json.dumps({"detail": "Email already registered"}), headers=headers, status=400)
            
            result = await env.DB.prepare("INSERT INTO users (email, hashed_password, name, business_name, industry) VALUES (?, ?, ?, ?, ?) RETURNING id").bind(email, password, name, business_name, industry).first()
            return Response.new(json.dumps({"id": result.id, "email": email, "name": name, "business_name": business_name, "industry": industry}), headers=headers)

        # POST /api/login
        if path == "/api/login" and request.method == "POST":
            body = await request.json()
            email = body.email
            password = body.password
            
            user = await env.DB.prepare("SELECT * FROM users WHERE email = ? AND hashed_password = ?").bind(email, password).first()
            if not user:
                return Response.new(json.dumps({"detail": "Invalid credentials"}), headers=headers, status=401)
            
            return Response.new(json.dumps({"id": user.id, "email": user.email, "name": user.name}), headers=headers)

        # GET /api/profile
        if path == "/api/profile" and request.method == "GET":
            user_id = url.searchParams.get("user_id") or "1"
            user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user_id).first()
            if not user:
                return Response.new(json.dumps({"detail": "Not found"}), headers=headers, status=404)
            return Response.new(json.dumps({
                "id": user.id, "email": user.email, "name": user.name, "business_name": user.business_name, "industry": user.industry
            }), headers=headers)

        # GET /api/analytics
        if path == "/api/analytics" and request.method == "GET":
            user_id = url.searchParams.get("user_id") or "1"
            spend_result = await env.DB.prepare("SELECT SUM(spent) as total_spend FROM campaigns WHERE user_id = ?").bind(user_id).first()
            spend = spend_result.total_spend if spend_result and spend_result.total_spend else 0
            
            data = {
                "total_spend": spend,
                "total_impressions": spend * 1000,
                "locations": ["FC Road", "JM Road"] if spend > 0 else ["", ""],
                "location_data": [spend * 0.6, spend * 0.4] if spend > 0 else [0, 0],
                "impressions": [spend*100, spend*200, spend*150] if spend > 0 else [0, 0, 0]
            }
            return Response.new(json.dumps(data), headers=headers)

        # POST /api/campaigns
        if path == "/api/campaigns" and request.method == "POST":
            form_data = await request.formData()
            user_id = form_data.get("user_id")
            location_id = form_data.get("location_id")
            days = form_data.get("days")
            time_slot = form_data.get("time_slot")
            schedule = form_data.get("schedule")
            total_cost = form_data.get("total_cost")
            
            # Note: We skip video upload in D1, normally requires Cloudflare R2
            video_url = ""
            
            # Get location title
            loc = await env.DB.prepare("SELECT title FROM inventory WHERE id = ?").bind(location_id).first()
            title = f"Campaign at {loc.title}" if loc else "New Campaign"
            
            result = await env.DB.prepare(
                "INSERT INTO campaigns (title, budget, spent, status, thumbnail, user_id, locations) VALUES (?, ?, ?, ?, ?, ?, ?)"
            ).bind(title, total_cost, 0, "Pending", video_url, user_id, f"[\"{location_id}\"]").run()
            
            return Response.new(json.dumps({"status": "success", "campaign_id": "created"}), headers=headers)

        return Response.new(json.dumps({"error": "Not Found"}), headers=headers, status=404)

    except Exception as e:
        return Response.new(json.dumps({"error": str(e)}), headers=headers, status=500)
