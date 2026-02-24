# Incident API - Quick Reference

## Base URL
```
http://localhost:5001/api
```

## Authentication
All endpoints require JWT token in header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 🔐 Login First
```http
POST /users/login
Content-Type: application/json

{
  "email": "manager@safebuild.com",
  "password": "manager123"
}
```

---

## 📝 Incident Endpoints

### 1. Create Incident (All Users)
```http
POST /incidents
Authorization: Bearer TOKEN

{
  "title": "Hazardous Material Spill",
  "type": "hazard",
  "severity": "high",
  "location": {
    "address": "Warehouse Building A"
  },
  "description": "Chemical spill detected",
  "dateOccurred": "2026-02-22T09:30:00.000Z"
}
```

### 2. Get All Incidents (All Users)
```http
GET /incidents
GET /incidents?status=open
GET /incidents?severity=high&type=hazard
GET /incidents?search=warehouse
GET /incidents?page=1&limit=10
```

### 3. Get Incident by ID (All Users)
```http
GET /incidents/65f1234567890abcdef12345
```

### 4. Update Incident Status (Manager/Officer)
```http
PATCH /incidents/65f1234567890abcdef12345/status

{
  "status": "investigating"
}
```

### 5. Update Incident Details (Manager/Officer)
```http
PUT /incidents/65f1234567890abcdef12345

{
  "severity": "medium",
  "assignedTo": "user_id_here",
  "resolutionNotes": "Issue resolved"
}
```

### 5b. Update Own Incident (Worker - Open Incidents Only)
```http
PUT /incidents/65f1234567890abcdef12345

{
  "title": "Updated Title",
  "severity": "high",
  "description": "Updated description",
  "location": {
    "address": "Updated address"
  }
}
```
**Note:** Workers can only edit their own incidents if status is "open"

### 6. Add Comment (Manager/Officer)
```http
POST /incidents/65f1234567890abcdef12345/comments

{
  "comment": "Investigation started. Team notified."
}
```

### 7. Get Statistics (Manager/Officer)
```http
GET /incidents/stats/summary
```

### 8. Delete Incident
```http
DELETE /incidents/65f1234567890abcdef12345
```
**Permissions:**
- Workers: Can delete own open incidents only
- Manager: Can delete any incident

---

## 🔐 Permission Rules

### Workers:
- ✅ Create incidents
- ✅ View own incidents
- ✅ **Edit own open incidents** (limited fields)
- ✅ **Delete own open incidents**
- ❌ Cannot edit/delete after status changes from "open"

### Manager/Officer:
- ✅ View all incidents
- ✅ Edit any incident (all fields)
- ✅ Update status
- ✅ Add comments
- ✅ Assign incidents

### Manager Only:
- ✅ Delete any incident (any status)

---

## 📊 Filter Options

### Status
- `open` - Newly reported
- `investigating` - Under investigation
- `resolved` - Issue resolved
- `closed` - Case closed

### Severity
- `low` - Minor risk
- `medium` - Moderate risk
- `high` - Serious risk

### Type
- `hazard` - Potential danger
- `near-miss` - Almost incident
- `accident` - Actual incident

---

## 🧪 Quick Test Sequence

1. Login as manager
2. Create incident: `POST /incidents`
3. List incidents: `GET /incidents`
4. Get one incident: `GET /incidents/:id`
5. Add comment: `POST /incidents/:id/comments`
6. Update status: `PATCH /incidents/:id/status`
7. Get stats: `GET /incidents/stats/summary`

---

## Test Accounts
- Manager: `manager@safebuild.com` / `manager123`
- Officer: `officer@safebuild.com` / `officer123`
- Trainer: `trainer@safebuild.com` / `trainer123`
