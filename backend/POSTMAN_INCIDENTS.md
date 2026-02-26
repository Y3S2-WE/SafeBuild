# Incident & Hazard Reporting API - Postman Testing Guide

## Component 3: Incident & Hazard Reporting System

This guide covers testing all endpoints for the Incident & Hazard Reporting component.

---

## 📋 Table of Contents
1. [Setup](#setup)
2. [Authentication](#authentication)
3. [Incident Endpoints](#incident-endpoints)
4. [Testing Workflow](#testing-workflow)
5. [Example Requests](#example-requests)

---

## 🔧 Setup

### Base URL
```
http://localhost:5001/api
```

### Authentication
All incident endpoints require authentication. You need to login first and use the JWT token.

**Test Accounts:**
- Manager: `manager@safebuild.com` / `manager123`
- Officer: `officer@safebuild.com` / `officer123`
- Worker: `worker@safebuild.com` / `worker123` (you may need to register a worker account)

---

## 🔐 Authentication

### 1. Login to Get Token

**Endpoint:** `POST /users/login`

**Request Body:**
```json
{
  "email": "manager@safebuild.com",
  "password": "manager123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "...",
    "firstName": "John",
    "lastName": "Manager",
    "email": "manager@safebuild.com",
    "role": "manager"
  }
}
```

**Important:** Copy the `token` value and use it in the Authorization header for all subsequent requests.

**Authorization Header Format:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 📝 Incident Endpoints

### 🔐 Permission Summary

| Action | Worker | Safety Officer | Manager |
|--------|--------|----------------|---------|
| Create incident | ✅ | ✅ | ✅ |
| View all incidents | Own only | ✅ All | ✅ All |
| View incident details | Own only | ✅ All | ✅ All |
| **Edit own incident (open)** | ✅ Limited fields | ✅ All fields | ✅ All fields |
| **Edit own incident (closed)** | ❌ | ✅ All fields | ✅ All fields |
| Edit any incident | ❌ | ✅ | ✅ |
| **Delete own incident (open)** | ✅ | ✅ | ✅ |
| **Delete own incident (closed)** | ❌ | ❌ | ✅ |
| Delete any incident | ❌ | ❌ | ✅ |
| Update incident status | ❌ | ✅ | ✅ |
| Add comments | ❌ | ✅ | ✅ |
| Assign incidents | ❌ | ✅ | ✅ |
| View statistics | ❌ | ✅ | ✅ |

**Worker Edit/Delete Rules:**
- ✅ Can edit/delete **their own** incidents
- ✅ Only when incident status is **"open"**
- ✅ Workers can edit: title, severity, description, location, evidencePhotos, dateOccurred
- ❌ Workers cannot edit: status, assignedTo, resolutionNotes
- ❌ Cannot edit/delete once investigation has started (status changed from "open")

---

### 1. Create Incident Report

**Endpoint:** `POST /incidents`

**Access:** All authenticated users (worker, manager, officer, trainer)

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Hazardous Material Spill in Warehouse",
  "type": "hazard",
  "severity": "high",
  "location": {
    "address": "Warehouse Building A, Section 3, SafeBuild Construction Site",
    "latitude": 6.9271,
    "longitude": 79.8612
  },
  "description": "Chemical spill detected near storage unit. Approximately 5 liters of industrial solvent leaked from damaged container. Area has been cordoned off but immediate cleanup required.",
  "evidencePhotos": [
    {
      "url": "https://example.com/photos/incident-001.jpg",
      "fileName": "spill-photo-1.jpg"
    },
    {
      "url": "https://example.com/photos/incident-002.jpg",
      "fileName": "spill-photo-2.jpg"
    }
  ],
  "dateOccurred": "2026-02-22T09:30:00.000Z"
}
```

**Field Descriptions:**
- `title` (required): Brief title of the incident
- `type` (required): One of: `"hazard"`, `"near-miss"`, `"accident"`
- `severity` (required): One of: `"low"`, `"medium"`, `"high"`
- `location.address` (required): Detailed location description
- `location.latitude` (optional): GPS latitude
- `location.longitude` (optional): GPS longitude
- `description` (required): Detailed description (max 2000 chars)
- `evidencePhotos` (optional): Array of photo URLs
- `dateOccurred` (required): When the incident occurred
- `assignedTo` (optional): User ID to assign incident to

**Success Response (201):**
```json
{
  "success": true,
  "message": "Incident reported successfully",
  "data": {
    "_id": "65f1234567890abcdef12345",
    "title": "Hazardous Material Spill in Warehouse",
    "type": "hazard",
    "severity": "high",
    "status": "open",
    "location": {
      "address": "Warehouse Building A, Section 3",
      "latitude": 6.9271,
      "longitude": 79.8612
    },
    "description": "Chemical spill detected...",
    "evidencePhotos": [...],
    "reportedBy": {
      "_id": "...",
      "firstName": "John",
      "lastName": "Worker",
      "email": "worker@safebuild.com",
      "role": "worker"
    },
    "reportedByName": "John Worker",
    "dateOccurred": "2026-02-22T09:30:00.000Z",
    "dateReported": "2026-02-22T10:00:00.000Z",
    "comments": [],
    "createdAt": "2026-02-22T10:00:00.000Z",
    "updatedAt": "2026-02-22T10:00:00.000Z"
  }
}
```

---

### 2. Get All Incidents (with Filters)

**Endpoint:** `GET /incidents`

**Access:** All authenticated users

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Query Parameters (all optional):**
- `status` - Filter by status: `open`, `investigating`, `resolved`, `closed`
- `severity` - Filter by severity: `low`, `medium`, `high`
- `type` - Filter by type: `hazard`, `near-miss`, `accident`
- `search` - Search in title, description, and location
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Example Requests:**

1. **Get all incidents:**
```
GET /incidents
```

2. **Filter by status:**
```
GET /incidents?status=open
```

3. **Filter by severity and type:**
```
GET /incidents?severity=high&type=hazard
```

4. **Search incidents:**
```
GET /incidents?search=warehouse
```

5. **Pagination:**
```
GET /incidents?page=1&limit=20
```

6. **Combined filters:**
```
GET /incidents?status=investigating&severity=high&page=1&limit=10
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 5,
  "total": 15,
  "page": 1,
  "pages": 2,
  "data": [
    {
      "_id": "65f1234567890abcdef12345",
      "title": "Hazardous Material Spill",
      "type": "hazard",
      "severity": "high",
      "status": "open",
      "location": {
        "address": "Warehouse Building A"
      },
      "description": "Chemical spill...",
      "reportedBy": {
        "_id": "...",
        "firstName": "John",
        "lastName": "Worker",
        "email": "worker@safebuild.com"
      },
      "dateOccurred": "2026-02-22T09:30:00.000Z",
      "createdAt": "2026-02-22T10:00:00.000Z"
    },
    // ... more incidents
  ]
}
```

**Note for Workers:** Workers can only see their own reported incidents.

---

### 3. Get Incident by ID (Detail Page)

**Endpoint:** `GET /incidents/:id`

**Access:** All authenticated users

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Example:**
```
GET /incidents/65f1234567890abcdef12345
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65f1234567890abcdef12345",
    "title": "Hazardous Material Spill in Warehouse",
    "type": "hazard",
    "severity": "high",
    "status": "investigating",
    "location": {
      "address": "Warehouse Building A, Section 3",
      "latitude": 6.9271,
      "longitude": 79.8612
    },
    "description": "Chemical spill detected near storage unit...",
    "evidencePhotos": [
      {
        "url": "https://example.com/photos/incident-001.jpg",
        "fileName": "spill-photo-1.jpg",
        "uploadedAt": "2026-02-22T10:00:00.000Z"
      }
    ],
    "reportedBy": {
      "_id": "...",
      "firstName": "John",
      "lastName": "Worker",
      "email": "worker@safebuild.com",
      "role": "worker",
      "phone": "+94771234567",
      "department": "Construction"
    },
    "reportedByName": "John Worker",
    "assignedTo": {
      "_id": "...",
      "firstName": "Sarah",
      "lastName": "Officer",
      "email": "officer@safebuild.com",
      "role": "officer",
      "phone": "+94777654321"
    },
    "assignedToName": "Sarah Officer",
    "comments": [
      {
        "_id": "...",
        "user": {
          "firstName": "Sarah",
          "lastName": "Officer",
          "role": "officer"
        },
        "userName": "Sarah Officer",
        "userRole": "officer",
        "comment": "Initial investigation started. Hazmat team notified.",
        "createdAt": "2026-02-22T10:15:00.000Z"
      }
    ],
    "dateOccurred": "2026-02-22T09:30:00.000Z",
    "dateReported": "2026-02-22T10:00:00.000Z",
    "createdAt": "2026-02-22T10:00:00.000Z",
    "updatedAt": "2026-02-22T10:15:00.000Z"
  }
}
```

---

### 4. Update Incident Status

**Endpoint:** `PATCH /incidents/:id/status`

**Access:** Manager and Officer only

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "investigating"
}
```

**Valid Status Values:**
- `open` - Newly reported
- `investigating` - Under investigation
- `resolved` - Issue resolved
- `closed` - Case closed

**Example:**
```
PATCH /incidents/65f1234567890abcdef12345/status
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Incident status updated successfully",
  "data": {
    "_id": "65f1234567890abcdef12345",
    "status": "investigating",
    // ... rest of incident data
  }
}
```

---

### 5. Update Incident Details

**Endpoint:** `PUT /incidents/:id`

**Access:** Workers can edit their own open incidents, Manager/Officer can edit any incident

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

#### For Workers (can only edit their own OPEN incidents):

**Editable Fields:**
- `title`
- `severity`
- `description`
- `location`
- `evidencePhotos`
- `dateOccurred`

**Request Body Example:**
```json
{
  "title": "Updated Incident Title",
  "severity": "medium",
  "description": "Updated description with more details",
  "location": {
    "address": "Updated location address",
    "latitude": 6.9271,
    "longitude": 79.8612
  },
  "evidencePhotos": [
    {
      "url": "https://example.com/photos/updated-photo.jpg",
      "fileName": "updated-photo.jpg"
    }
  ],
  "dateOccurred": "2026-02-22T09:00:00.000Z"
}
```

**Restrictions:**
- ❌ Cannot edit if status is not "open"
- ❌ Cannot change status, assignedTo, or resolutionNotes

#### For Manager/Officer (can edit any incident):

**Request Body (all fields optional):**
```json
{
  "title": "Updated Incident Title",
  "status": "investigating",
  "severity": "medium",
  "assignedTo": "65f0987654321abcdef09876",
  "description": "Updated description with more details",
  "location": {
    "address": "Updated location address"
  },
  "resolutionNotes": "Cleanup completed. Safety protocols reviewed with team.",
  "evidencePhotos": [...],
  "dateOccurred": "2026-02-22T09:00:00.000Z"
}
```

**Example:**
```
PUT /incidents/65f1234567890abcdef12345
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Incident updated successfully",
  "data": {
    // ... updated incident data
  }
}
```

**Error Response (403) - Worker trying to edit closed incident:**
```json
{
  "success": false,
  "message": "Cannot edit incident that is no longer open"
}
```

**Error Response (403) - Worker trying to edit someone else's incident:**
```json
{
  "success": false,
  "message": "Not authorized to update this incident"
}
```

---

### 6. Add Investigation Comment

**Endpoint:** `POST /incidents/:id/comments`

**Access:** Manager and Officer only

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Request Body:**
```json
{
  "comment": "Conducted site inspection. Found that storage container was improperly sealed. Recommended additional training for warehouse staff on proper chemical storage procedures."
}
```

**Example:**
```
POST /incidents/65f1234567890abcdef12345/comments
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "_id": "65f1234567890abcdef12345",
    "comments": [
      {
        "_id": "...",
        "user": {
          "firstName": "Sarah",
          "lastName": "Officer",
          "role": "officer"
        },
        "userName": "Sarah Officer",
        "userRole": "officer",
        "comment": "Conducted site inspection...",
        "createdAt": "2026-02-22T11:00:00.000Z"
      }
    ],
    // ... rest of incident data
  }
}
```

---

### 7. Delete Incident

**Endpoint:** `DELETE /incidents/:id`

**Access:** Workers can delete their own open incidents, Manager can delete any incident

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Example:**
```
DELETE /incidents/65f1234567890abcdef12345
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Incident deleted successfully"
}
```

**Worker Restrictions:**
- ✅ Can delete their own incidents if status is "open"
- ❌ Cannot delete if status is "investigating", "resolved", or "closed"
- ❌ Cannot delete other workers' incidents

**Manager:**
- ✅ Can delete any incident regardless of status

**Error Response (403) - Worker trying to delete closed incident:**
```json
{
  "success": false,
  "message": "Cannot delete incident that is no longer open"
}
```

**Error Response (403) - Worker trying to delete someone else's incident:**
```json
{
  "success": false,
  "message": "Not authorized to delete this incident"
}
```

---

### 8. Get Incident Statistics

**Endpoint:** `GET /incidents/stats/summary`

**Access:** Manager and Officer only

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Example:**
```
GET /incidents/stats/summary
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "byStatus": {
      "open": 12,
      "investigating": 8,
      "resolved": 20,
      "closed": 5
    },
    "bySeverity": {
      "low": 15,
      "medium": 20,
      "high": 10
    },
    "byType": {
      "hazard": 20,
      "near-miss": 15,
      "accident": 10
    }
  }
}
```

---

## 🧪 Testing Workflow

### Scenario 1: Worker Reports an Incident

1. **Login as Worker**
   ```
   POST /users/login
   Body: { "email": "worker@safebuild.com", "password": "worker123" }
   ```

2. **Create Incident Report**
   ```
   POST /incidents
   Body: { incident details }
   ```

3. **View Own Incidents**
   ```
   GET /incidents
   ```

4. **View Specific Incident**
   ```
   GET /incidents/:id
   ```

5. **Edit Own Incident (if still open)**
   ```
   PUT /incidents/:id
   Body: { 
     "description": "Updated description with more details",
     "severity": "high"
   }
   ```

6. **Delete Own Incident (if still open)**
   ```
   DELETE /incidents/:id
   ```

---

### Scenario 1b: Worker Tries to Edit/Delete Closed Incident (Should Fail)

1. **Login as Worker**
   ```
   POST /users/login
   ```

2. **Try to Edit Incident with Status "investigating" or "resolved"**
   ```
   PUT /incidents/:id
   Body: { "description": "Trying to update" }
   ```
   **Expected Result:** 403 Forbidden - "Cannot edit incident that is no longer open"

3. **Try to Delete Incident with Status "investigating" or "resolved"**
   ```
   DELETE /incidents/:id
   ```
   **Expected Result:** 403 Forbidden - "Cannot delete incident that is no longer open"

---

### Scenario 2: Manager/Officer Reviews and Investigates

1. **Login as Manager/Officer**
   ```
   POST /users/login
   Body: { "email": "manager@safebuild.com", "password": "manager123" }
   ```

2. **View All Open Incidents**
   ```
   GET /incidents?status=open
   ```

3. **View High Severity Incidents**
   ```
   GET /incidents?severity=high
   ```

4. **Get Incident Details**
   ```
   GET /incidents/:id
   ```

5. **Update Status to Investigating**
   ```
   PATCH /incidents/:id/status
   Body: { "status": "investigating" }
   ```

6. **Assign Incident to Officer**
   ```
   PUT /incidents/:id
   Body: { "assignedTo": "officer_user_id" }
   ```

7. **Add Investigation Comment**
   ```
   POST /incidents/:id/comments
   Body: { "comment": "Investigation findings..." }
   ```

8. **Add Another Comment**
   ```
   POST /incidents/:id/comments
   Body: { "comment": "Corrective actions taken..." }
   ```

9. **Update Status to Resolved**
   ```
   PATCH /incidents/:id/status
   Body: { "status": "resolved" }
   ```

10. **Add Resolution Notes**
    ```
    PUT /incidents/:id
    Body: { 
      "resolutionNotes": "Issue resolved. Safety protocols updated.",
      "status": "closed"
    }
    ```

---

### Scenario 3: Dashboard Statistics

1. **Login as Manager/Officer**
   ```
   POST /users/login
   ```

2. **Get Statistics**
   ```
   GET /incidents/stats/summary
   ```

3. **Filter by Different Criteria**
   ```
   GET /incidents?type=accident&severity=high
   GET /incidents?status=open&type=hazard
   ```

---

## 📊 Sample Test Data

### Example Incidents to Create:

**1. Hazard - High Severity:**
```json
{
  "title": "Exposed Electrical Wiring in Main Office",
  "type": "hazard",
  "severity": "high",
  "location": {
    "address": "Main Office Building, 2nd Floor Corridor"
  },
  "description": "Live electrical wires exposed near water cooler. Immediate safety risk.",
  "dateOccurred": "2026-02-22T08:00:00.000Z"
}
```

**2. Near-Miss - Medium Severity:**
```json
{
  "title": "Falling Object Nearly Hits Worker",
  "type": "near-miss",
  "severity": "medium",
  "location": {
    "address": "Construction Site Zone B, Scaffolding Level 3"
  },
  "description": "A toolbox fell from level 5 scaffolding, narrowly missing a worker below. No injuries but could have been fatal. Need to review tool securing procedures.",
  "dateOccurred": "2026-02-21T14:30:00.000Z"
}
```

**3. Accident - High Severity:**
```json
{
  "title": "Worker Injured - Slip and Fall",
  "type": "accident",
  "severity": "high",
  "location": {
    "address": "Warehouse Building C, Loading Dock"
  },
  "description": "Worker slipped on wet surface near loading dock. Sustained minor leg injury. First aid administered on site. Worker taken to hospital for examination.",
  "dateOccurred": "2026-02-20T11:00:00.000Z"
}
```

**4. Hazard - Low Severity:**
```json
{
  "title": "Poor Lighting in Parking Area",
  "type": "hazard",
  "severity": "low",
  "location": {
    "address": "Employee Parking Lot, Section D"
  },
  "description": "Several light fixtures not working in parking area. Creates safety concern for evening shifts.",
  "dateOccurred": "2026-02-22T18:00:00.000Z"
}
```

---

## 🔍 Testing Checklist

- [ ] Worker can create incident report
- [ ] Worker can view their own incidents
- [ ] Worker cannot view other workers' incidents
- [ ] **Worker can edit their own incident (if status is open)**
- [ ] **Worker cannot edit their own incident (if status is not open)**
- [ ] **Worker can delete their own incident (if status is open)**
- [ ] **Worker cannot delete their own incident (if status is not open)**
- [ ] **Worker cannot edit other workers' incidents**
- [ ] **Worker cannot delete other workers' incidents**
- [ ] Manager can view all incidents
- [ ] Officer can view all incidents
- [ ] Manager/Officer can update incident status
- [ ] Manager/Officer can update any incident details
- [ ] Manager/Officer can add comments
- [ ] Manager/Officer can assign incidents
- [ ] Manager can delete any incident
- [ ] Officer cannot delete incidents via the delete endpoint (only Manager)
- [ ] Filtering works (status, severity, type)
- [ ] Search works across title, description, location
- [ ] Pagination works correctly
- [ ] Statistics endpoint returns accurate data
- [ ] Date fields are properly set (dateResolved when status changes)

---

## 🚨 Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Please provide all required fields"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route. Please login."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "User role 'worker' is not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Incident not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to create incident report",
  "error": "Error details..."
}
```

---

## 📱 Postman Collection Setup

### Environment Variables
Create a Postman environment with these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| base_url | http://localhost:5001/api | |
| token | | (auto-updated after login) |
| incident_id | | (save after creating incident) |

### Pre-request Scripts

For login request, add this to Tests tab:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.token);
}
```

For create incident request, add this to Tests tab:
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("incident_id", response.data._id);
}
```

---

## 🎯 Assignment Requirements Covered

✅ **Worker - Add Incident Report**
- POST /incidents endpoint
- Fields: type, severity, location, description, evidence photos

✅ **Worker - Edit Own Incident Report (NEW)**
- PUT /incidents/:id endpoint
- Workers can edit their own incidents while status is "open"
- Can update: title, severity, description, location, evidence photos, dateOccurred

✅ **Worker - Delete Own Incident Report (NEW)**
- DELETE /incidents/:id endpoint
- Workers can delete their own incidents while status is "open"

✅ **Manager/Officer - Incident List View**
- GET /incidents endpoint
- Filters: status, severity, type
- Search functionality
- Pagination

✅ **Update Incident Status**
- PATCH /incidents/:id/status endpoint
- Status options: open, investigating, resolved, closed

✅ **Update Any Incident Details**
- PUT /incidents/:id endpoint (Manager/Officer can edit any incident)

✅ **Add Investigation Comments**
- POST /incidents/:id/comments endpoint
- Comments with user info and timestamp

✅ **Incident Detail Page**
- GET /incidents/:id endpoint
- Complete incident information
- Update severity: PUT /incidents/:id
- Assign responsible person: PUT /incidents/:id with assignedTo
- View all comments

---

## 📞 Support

If you encounter any issues:
1. Check that the server is running on port 5001
2. Verify your token is valid (not expired)
3. Ensure you're using the correct role for the endpoint
4. Check request body format matches examples

---

**Happy Testing! 🚀**

For questions, contact the team lead or refer to the main project documentation.
