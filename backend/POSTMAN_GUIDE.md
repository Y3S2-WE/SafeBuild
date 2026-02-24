# Postman Testing Guide - SafeBuild API

This guide will help you test all SafeBuild APIs using Postman.

## 📥 Step 1: Install Postman

Download and install Postman from: https://www.postman.com/downloads/

---

## 🔧 Step 2: Create Environment

1. Click on **"Environments"** in the left sidebar
2. Click **"+"** to create a new environment
3. Name it: `SafeBuild Local`
4. Add the following variables:

| Variable Name | Initial Value | Current Value |
|---------------|---------------|---------------|
| `base_url` | `http://localhost:5001/api` | `http://localhost:5001/api` |
| `token` | (leave empty) | (leave empty) |

5. Click **Save**
6. Select **"SafeBuild Local"** from the environment dropdown (top right)
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

## 📁 Step 3: Create Collection

1. Click **"Collections"** in the left sidebar
2. Click **"+"** to create a new collection
3. Name it: `SafeBuild API`
4. Click **Save**

---

## 🔐 Step 4: Add Requests

### Request 1: Health Check

**Purpose**: Verify API is running

1. Click on `SafeBuild API` collection
2. Click **"Add Request"**
3. Configure:
   - **Name**: `Health Check`
   - **Method**: `GET`
   - **URL**: `{{base_url}}/health`
4. Click **Send**
5. You should see:
   ```json
   {
     "success": true,
     "message": "SafeBuild API is running",
     "timestamp": "2026-02-18T...",
     "environment": "development"
   }
   ```

---

### Request 2: User Registration

**Purpose**: Register a new user

1. Add new request to collection
2. Configure:
   - **Name**: `Register User`
   - **Method**: `POST`
   - **URL**: `{{base_url}}/users/register`
3. Go to **"Body"** tab
4. Select **"raw"** and **"JSON"**
5. Paste:
   ```json
   {
     "firstName": "John",
     "lastName": "Doe",
     "email": "john.doe@test.com",
     "password": "password123",
     "role": "worker",
     "phone": "+1234567890",
     "department": "Construction",
     "employeeId": "WRK003"
   }
   ```
6. Click **Send**
7. **Expected Response** (201 Created):
   ```json
   {
     "success": true,
     "message": "User registered successfully",
     "data": {
       "user": {
         "id": "...",
         "firstName": "John",
         "lastName": "Doe",
         "email": "john.doe@test.com",
         "role": "worker",
         "phone": "+1234567890",
         "department": "Construction",
         "employeeId": "WRK003"
       },
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     }
   }
   ```

---

### Request 3: User Login

**Purpose**: Login and get authentication token

1. Add new request to collection
2. Configure:
   - **Name**: `Login User`
   - **Method**: `POST`
   - **URL**: `{{base_url}}/users/login`
3. Go to **"Body"** tab
4. Select **"raw"** and **"JSON"**
5. Paste:
   ```json
   {
     "email": "manager@safebuild.com",
     "password": "manager123"
   }
   ```
6. Go to **"Tests"** tab
7. Add this script to automatically save the token:
   ```javascript
   if (pm.response.code === 200) {
       const jsonData = pm.response.json();
       pm.environment.set("token", jsonData.data.token);
       console.log("Token saved:", jsonData.data.token);
   }
   ```
8. Click **Send**
9. **Expected Response** (200 OK):
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
         "phone": "+1234567890",
         "department": "Management",
         "employeeId": "MGR001"
       },
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     }
   }
   ```
10. The token is now automatically saved to your environment! ✅

---

### Request 4: Get User Profile

**Purpose**: Get current logged-in user's profile

1. Add new request to collection
2. Configure:
   - **Name**: `Get Profile`
   - **Method**: `GET`
   - **URL**: `{{base_url}}/users/profile`
3. Go to **"Authorization"** tab
4. Select **"Bearer Token"**
5. In Token field, enter: `{{token}}`
6. Click **Send**
7. **Expected Response** (200 OK):
   ```json
   {
     "success": true,
     "data": {
       "_id": "...",
       "firstName": "John",
       "lastName": "Manager",
       "email": "manager@safebuild.com",
       "role": "manager",
       "phone": "+1234567890",
       "employeeId": "MGR001",
       "department": "Management",
       "isActive": true,
       "certifications": [],
       "completedCourses": [],
       "createdAt": "2026-02-17T...",
       "updatedAt": "2026-02-18T..."
     }
   }
   ```

---

### Request 5: Update Profile

**Purpose**: Update user's own profile

1. Add new request to collection
2. Configure:
   - **Name**: `Update Profile`
   - **Method**: `PUT`
   - **URL**: `{{base_url}}/users/profile`
3. Go to **"Authorization"** tab
4. Select **"Bearer Token"**
5. In Token field, enter: `{{token}}`
6. Go to **"Body"** tab
7. Select **"raw"** and **"JSON"**
8. Paste:
   ```json
   {
     "firstName": "John Updated",
     "lastName": "Manager Updated",
     "phone": "+9876543210",
     "department": "Senior Management"
   }
   ```
9. Click **Send**
10. **Expected Response** (200 OK):
    ```json
    {
      "success": true,
      "message": "Profile updated successfully",
      "data": {
        "_id": "...",
        "firstName": "John Updated",
        "lastName": "Manager Updated",
        "email": "manager@safebuild.com",
        "role": "manager",
        "phone": "+9876543210",
        "department": "Senior Management",
        ...
      }
    }
    ```

---

### Request 6: Get All Users (Admin Only)

**Purpose**: Get list of all users (Manager/Officer/Trainer only)

1. Add new request to collection
2. Configure:
   - **Name**: `Get All Users`
   - **Method**: `GET`
   - **URL**: `{{base_url}}/users`
3. Go to **"Authorization"** tab
4. Select **"Bearer Token"**
5. In Token field, enter: `{{token}}`
6. Click **Send**
7. **Expected Response** (200 OK):
   ```json
   {
     "success": true,
     "count": 5,
     "data": [
       {
         "_id": "...",
         "firstName": "John",
         "lastName": "Manager",
         "email": "manager@safebuild.com",
         "role": "manager",
         ...
       },
       ...
     ]
   }
   ```

**Note**: If you login as a worker, you'll get:
```json
{
  "success": false,
  "message": "User role 'worker' is not authorized to access this route"
}
```

---

### Request 7: Get User by ID (Admin Only)

**Purpose**: Get specific user details by ID

1. Add new request to collection
2. Configure:
   - **Name**: `Get User by ID`
   - **Method**: `GET`
   - **URL**: `{{base_url}}/users/USER_ID_HERE`
3. Go to **"Authorization"** tab
4. Select **"Bearer Token"**
5. In Token field, enter: `{{token}}`
6. Replace `USER_ID_HERE` with an actual user ID from "Get All Users" response
7. Click **Send**

---

## 🧪 Step 5: Test Scenarios

### Scenario 1: Complete User Journey

1. **Health Check** - Verify API is running
2. **Register User** - Create a new worker account
3. **Login User** - Login with the new account (token auto-saved)
4. **Get Profile** - View your profile
5. **Update Profile** - Modify your information
6. **Get All Users** - Should fail (worker role)

### Scenario 2: Admin Access

1. **Login User** - Login as manager (`manager@safebuild.com` / `manager123`)
2. **Get All Users** - Should succeed
3. **Get User by ID** - Should succeed

### Scenario 3: Test Different Roles

**Manager Login:**
```json
{
  "email": "manager@safebuild.com",
  "password": "manager123"
}
```

**Officer Login:**
```json
{
  "email": "officer@safebuild.com",
  "password": "officer123"
}
```

**Trainer Login:**
```json
{
  "email": "trainer@safebuild.com",
  "password": "trainer123"
}
```

### Scenario 4: Test Validation

**Invalid Email:**
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "not-valid-email",
  "password": "test123"
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Please provide a valid email",
      "path": "email",
      ...
    }
  ]
}
```

**Short Password:**
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@test.com",
  "password": "123"
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Password must be at least 6 characters",
      "path": "password",
      ...
    }
  ]
}
```

---

## 📋 Pre-request Script (Collection Level)

To automatically add authorization to all requests:

1. Click on `SafeBuild API` collection
2. Go to **"Authorization"** tab
3. Select **"Bearer Token"**
4. Enter: `{{token}}`
5. Save

Now all requests in this collection will automatically use the token!

---

## 🔄 Tests Script Examples

### Auto-save Token on Login

Add to **Login User** request's **Tests** tab:
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("token", jsonData.data.token);
    pm.environment.set("user_id", jsonData.data.user.id);
    console.log("✅ Token and User ID saved!");
}
```

### Verify Success Response

Add to any request's **Tests** tab:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.be.true;
});
```

### Verify Error Response

For testing error cases:
```javascript
pm.test("Status code is 401", function () {
    pm.response.to.have.status(401);
});

pm.test("Error message exists", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData.success).to.be.false;
});
```

---

## 📤 Export/Import Collection

### Export Collection:
1. Right-click on `SafeBuild API` collection
2. Click **"Export"**
3. Select **"Collection v2.1"**
4. Save file as `SafeBuild_API.postman_collection.json`

### Import Collection:
1. Click **"Import"** button (top left)
2. Select the JSON file
3. Click **"Import"**

### Share with Team:
- Share the exported JSON file with your team
- They can import it directly into their Postman

---

## 🎯 Quick Reference

### Available Test Accounts

| Role | Email | Password | Employee ID |
|------|-------|----------|-------------|
| Manager | manager@safebuild.com | manager123 | MGR001 |
| Officer | officer@safebuild.com | officer123 | OFF001 |
| Trainer | trainer@safebuild.com | trainer123 | TRN001 |

### Common HTTP Status Codes

| Code | Meaning | When You'll See It |
|------|---------|-------------------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST (register) |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid token, wrong password |
| 403 | Forbidden | Insufficient permissions (RBAC) |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Something wrong on backend |

### Environment Variables

| Variable | Purpose | Set By |
|----------|---------|--------|
| `{{base_url}}` | API base URL | You (manual) |
| `{{token}}` | JWT token | Login request (auto) |
| `{{user_id}}` | Current user ID | Login request (auto) |

---

## 🐛 Troubleshooting

### "Could not send request"
- **Solution**: Make sure server is running (`npm run dev`)

### "401 Unauthorized"
- **Solution**: Login first to get a valid token

### Token expired
- **Solution**: Login again to get a fresh token (tokens expire after 7 days)

### "User role 'worker' is not authorized"
- **Solution**: Login with manager/officer/trainer account for admin routes

### Connection refused
- **Solution**: Check server is running on correct port (5001)
- Check `{{base_url}}` in environment matches your server

---

## 📝 Tips

1. **Use Collections Folders** - Organize requests by component:
   - 📁 User Management
   - 📁 Courses (future)
   - 📁 Assessments (future)
   - 📁 Incidents (future)
   - 📁 Audits (future)

2. **Use Variables** - Store dynamic values:
   - `{{user_id}}` - Current user
   - `{{course_id}}` - Test course ID
   - etc.

3. **Save Examples** - Save successful responses as examples for documentation

4. **Use Tests** - Add automated tests to verify responses

5. **Use Pre-request Scripts** - Log requests, set timestamps, etc.

---

## ✅ Checklist

- [ ] Postman installed
- [ ] Environment created with `base_url` and `token`
- [ ] Collection created
- [ ] Health Check request working
- [ ] Login request working and auto-saving token
- [ ] Protected routes working with token
- [ ] Role-based access tested (worker vs manager)
- [ ] Validation tested (invalid email, short password)
- [ ] All CRUD operations tested

---

Happy Testing! 🚀

For more help, see: `API_TESTING.md` for cURL examples
