# User Management API - Testing Guide

## 🔐 Permanent User Accounts

The following permanent accounts have been created:

### Manager Account
- **Email**: `manager@safebuild.com`
- **Password**: `manager123`
- **Role**: `manager`
- **Employee ID**: `MGR001`

### Safety Officer Account
- **Email**: `officer@safebuild.com`
- **Password**: `officer123`
- **Role**: `officer`
- **Employee ID**: `OFF001`

### Trainer Account
- **Email**: `trainer@safebuild.com`
- **Password**: `trainer123`
- **Role**: `trainer`
- **Employee ID**: `TRN001`

---

## 📝 API Endpoints

### Base URL
```
http://localhost:5000/api
```

### 1. User Registration
**POST** `/api/users/register`

**Body** (JSON):
```json
{
  "firstName": "Test",
  "lastName": "Worker",
  "email": "worker@test.com",
  "password": "password123",
  "role": "worker",
  "phone": "+1234567890",
  "department": "Construction",
  "employeeId": "WRK001"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "firstName": "Test",
      "lastName": "Worker",
      "email": "worker@test.com",
      "role": "worker",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. User Login
**POST** `/api/users/login`

**Body** (JSON):
```json
{
  "email": "manager@safebuild.com",
  "password": "manager123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "firstName": "John",
      "lastName": "Manager",
      "email": "manager@safebuild.com",
      "role": "manager",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Get Current User Profile
**GET** `/api/users/profile`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "firstName": "John",
    "lastName": "Manager",
    "email": "manager@safebuild.com",
    "role": "manager",
    ...
  }
}
```

---

### 4. Update User Profile
**PUT** `/api/users/profile`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body** (JSON):
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "phone": "+9876543210",
  "department": "Updated Department"
}
```

---

### 5. Get All Users (Admin Only)
**GET** `/api/users`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Access**: Manager, Officer, Trainer only

**Response**:
```json
{
  "success": true,
  "count": 4,
  "data": [...]
}
```

---

### 6. Get User by ID (Admin Only)
**GET** `/api/users/:id`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Access**: Manager, Officer, Trainer only

---

## 🧪 Testing with cURL

### Register a new worker:
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Worker",
    "email": "worker@test.com",
    "password": "password123",
    "role": "worker"
  }'
```

### Login as Manager:
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@safebuild.com",
    "password": "manager123"
  }'
```

### Get Profile (replace TOKEN with actual token):
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get All Users (Manager/Officer/Trainer only):
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🛡️ Role-Based Access Control

### Roles
- **worker**: Basic user, can access own profile and training materials
- **manager**: Can view all users, manage overall operations
- **officer**: Safety officer, can view users and manage safety reports
- **trainer**: Can view users and manage training content

### Protected Routes
- `/api/users` (GET) - Requires: manager, officer, or trainer role
- `/api/users/:id` (GET) - Requires: manager, officer, or trainer role
- `/api/users/profile` (GET/PUT) - Requires: Any authenticated user

---

## 🔄 Testing Workflow

1. **Start the server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Login as Manager**:
   - Use Postman or cURL to login with manager credentials
   - Save the returned JWT token

3. **Test Protected Routes**:
   - Add the token to Authorization header as `Bearer YOUR_TOKEN`
   - Try accessing different endpoints

4. **Test Role-Based Access**:
   - Try accessing admin routes with worker token (should fail)
   - Try accessing admin routes with manager token (should succeed)

---

## 📊 Postman Collection

Import this collection to Postman for easy testing:
- Create a new collection called "SafeBuild API"
- Add environment variables:
  - `base_url`: `http://localhost:5000/api`
  - `token`: (will be set after login)
- Add the endpoints listed above
