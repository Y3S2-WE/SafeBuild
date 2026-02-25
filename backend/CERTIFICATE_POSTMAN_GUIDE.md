# Certificate System - Postman Testing Guide

Complete guide for testing the Certificate Generation & Verification system in SafeBuild.

---

## 📋 Table of Contents

1. [Setup](#setup)
2. [Certificate Auto-Generation](#certificate-auto-generation)
3. [Certificate Retrieval](#certificate-retrieval)
4. [Certificate Verification (Public)](#certificate-verification-public)
5. [Certificate Management (Admin)](#certificate-management-admin)
6. [Complete Testing Workflow](#complete-testing-workflow)
7. [Error Scenarios](#error-scenarios)
8. [Testing Checklist](#testing-checklist)

---

## Setup

### Base URL
```
http://localhost:5001/api
```

### Environment Variables
Create these variables in Postman:
- `base_url`: `http://localhost:5001/api`
- `token`: (will be set after login)
- `worker_token`: (worker's JWT token)
- `trainer_token`: (trainer's JWT token)
- `certificate_code`: (will be set after certificate generation)
- `certificate_id`: (will be set after certificate generation)

### Test Users
```javascript
// Worker (to pass quiz and get certificate)
{
  "email": "bob@safebuild.com",
  "password": "worker123"
}

// Trainer (to view all certificates)
{
  "email": "trainer@safebuild.com",
  "password": "trainer123"
}

// Manager (admin access)
{
  "email": "manager@safebuild.com",
  "password": "manager123"
}
```

---

## Certificate Auto-Generation

### How It Works
Certificates are **automatically generated** when a worker passes a quiz (achieves passing mark).

### Prerequisites
1. Quiz must exist with `passMark` set (e.g., 70%)
2. User must submit quiz attempt
3. User must achieve score ≥ passMark

### Step-by-Step Process

#### 1. Login as Worker
```http
POST {{base_url}}/users/login
Content-Type: application/json

{
  "email": "bob@safebuild.com",
  "password": "worker123"
}
```

**Save token to environment:**
```javascript
// In Postman Tests tab
pm.environment.set("worker_token", pm.response.json().data.token);
```

#### 2. Get Available Quizzes
```http
GET {{base_url}}/quizzes
Authorization: Bearer {{worker_token}}
```

**Save quiz ID:**
```javascript
// In Postman Tests tab
const quiz = pm.response.json().data.quizzes[0];
pm.environment.set("quiz_id", quiz._id);
```

#### 3. Submit Quiz Attempt (Pass the Quiz)
```http
POST {{base_url}}/quiz-attempts
Authorization: Bearer {{worker_token}}
Content-Type: application/json

{
  "quizId": "{{quiz_id}}",
  "startedAt": "2024-02-19T10:00:00.000Z",
  "answers": [
    { "selectedAnswer": 0 },
    { "selectedAnswer": 1 },
    { "selectedAnswer": 2 },
    { "selectedAnswer": 3 }
  ]
}
```

**Expected Response (if passed):**
```json
{
  "success": true,
  "message": "Congratulations! You passed the quiz! A certificate has been generated.",
  "data": {
    "attempt": {
      "_id": "65d3e...",
      "user": "65d2a...",
      "quiz": {
        "_id": "65d3c...",
        "title": "Workplace Safety Fundamentals",
        "description": "Basic safety quiz",
        "passMark": 70
      },
      "score": 35,
      "percentage": 88,
      "passed": true,
      "submittedAt": "2024-02-19T10:15:30.000Z"
    },
    "certificate": {
      "certificateCode": "CERT-A8B9C2D1",
      "issuedAt": "2024-02-19T10:15:30.123Z"
    }
  }
}
```

**Save certificate code:**
```javascript
// In Postman Tests tab
if (pm.response.json().data.certificate) {
  pm.environment.set("certificate_code", pm.response.json().data.certificate.certificateCode);
}
```

**Note:** Certificate is only generated if:
- `passed` is `true`
- No valid certificate exists for this user + quiz combination
- If certificate already exists, it returns the existing one

---

## Certificate Retrieval

### 1. Get My Certificates

**Purpose:** View all certificates earned by the authenticated user

```http
GET {{base_url}}/certificates/my-certificates
Authorization: Bearer {{worker_token}}
```

**Response:**
```json
{
  "success": true,
  "message": "Certificates retrieved successfully",
  "data": {
    "count": 2,
    "certificates": [
      {
        "_id": "65d3f...",
        "certificateCode": "CERT-A8B9C2D1",
        "quizTitle": "Workplace Safety Fundamentals",
        "userName": "Bob Worker",
        "userEmail": "bob@safebuild.com",
        "score": 35,
        "totalPoints": 40,
        "percentage": 88,
        "issuedAt": "2024-02-19T10:15:30.123Z",
        "expiresAt": null,
        "isValid": true,
        "quiz": {
          "_id": "65d3c...",
          "title": "Workplace Safety Fundamentals",
          "description": "Basic safety quiz"
        }
      }
    ]
  }
}
```

### 2. Get Certificate by ID

**Purpose:** View detailed certificate information

```http
GET {{base_url}}/certificates/{{certificate_id}}
Authorization: Bearer {{worker_token}}
```

**Authorization Rules:**
- Owner can view their own certificate
- Admin (manager/officer/trainer) can view any certificate

**Response:**
```json
{
  "success": true,
  "message": "Certificate retrieved successfully",
  "data": {
    "_id": "65d3f...",
    "user": {
      "_id": "65d2a...",
      "firstName": "Bob",
      "lastName": "Worker",
      "email": "bob@safebuild.com"
    },
    "quiz": {
      "_id": "65d3c...",
      "title": "Workplace Safety Fundamentals",
      "description": "Basic safety quiz"
    },
    "quizAttempt": {
      "_id": "65d3e...",
      "score": 35,
      "percentage": 88,
      "submittedAt": "2024-02-19T10:15:30.000Z"
    },
    "certificateCode": "CERT-A8B9C2D1",
    "quizTitle": "Workplace Safety Fundamentals",
    "userName": "Bob Worker",
    "userEmail": "bob@safebuild.com",
    "score": 35,
    "totalPoints": 40,
    "percentage": 88,
    "issuedAt": "2024-02-19T10:15:30.123Z",
    "expiresAt": null,
    "isValid": true
  }
}
```

---

## Certificate Verification (Public)

### Verify Certificate by Code

**Purpose:** Public endpoint for employers/auditors to verify certificate authenticity

**NO AUTHENTICATION REQUIRED** ✅

```http
GET {{base_url}}/certificates/verify/{{certificate_code}}
```

**Example:**
```http
GET {{base_url}}/certificates/verify/CERT-A8B9C2D1
```

**Response (Valid Certificate):**
```json
{
  "success": true,
  "message": "Certificate is valid",
  "data": {
    "isValid": true,
    "certificate": {
      "certificateCode": "CERT-A8B9C2D1",
      "userName": "Bob Worker",
      "userEmail": "bob@safebuild.com",
      "quizTitle": "Workplace Safety Fundamentals",
      "score": 35,
      "totalPoints": 40,
      "percentage": 88,
      "issuedAt": "2024-02-19T10:15:30.123Z",
      "expiresAt": null
    }
  }
}
```

**Response (Invalid/Not Found):**
```json
{
  "success": false,
  "message": "Certificate not found. Invalid certificate code.",
  "data": {
    "isValid": false
  }
}
```

**Response (Revoked Certificate):**
```json
{
  "success": true,
  "message": "Certificate found but has been revoked",
  "data": {
    "isValid": false,
    "certificate": {
      "certificateCode": "CERT-A8B9C2D1",
      "issuedAt": "2024-02-19T10:15:30.123Z",
      "revokedAt": "2024-02-20T14:30:00.000Z"
    }
  }
}
```

**Response (Expired Certificate):**
```json
{
  "success": true,
  "message": "Certificate found but has expired",
  "data": {
    "isValid": false,
    "certificate": {
      "certificateCode": "CERT-A8B9C2D1",
      "userName": "Bob Worker",
      "quizTitle": "Workplace Safety Fundamentals",
      "issuedAt": "2024-02-19T10:15:30.123Z",
      "expiresAt": "2024-08-19T10:15:30.123Z"
    }
  }
}
```

---

## Certificate Management (Admin)

### 1. Get All Certificates

**Access:** Manager, Officer, Trainer only

```http
GET {{base_url}}/certificates
Authorization: Bearer {{trainer_token}}
```

**Query Parameters (optional):**
- `userId`: Filter by user ID
- `quizId`: Filter by quiz ID
- `isValid`: Filter by validity (`true` or `false`)

**Example with filters:**
```http
GET {{base_url}}/certificates?quizId=65d3c...&isValid=true
Authorization: Bearer {{trainer_token}}
```

**Response:**
```json
{
  "success": true,
  "message": "Certificates retrieved successfully",
  "data": {
    "count": 5,
    "certificates": [
      {
        "_id": "65d3f...",
        "user": {
          "_id": "65d2a...",
          "firstName": "Bob",
          "lastName": "Worker",
          "email": "bob@safebuild.com",
          "role": "worker"
        },
        "quiz": {
          "_id": "65d3c...",
          "title": "Workplace Safety Fundamentals"
        },
        "certificateCode": "CERT-A8B9C2D1",
        "quizTitle": "Workplace Safety Fundamentals",
        "userName": "Bob Worker",
        "userEmail": "bob@safebuild.com",
        "score": 35,
        "percentage": 88,
        "issuedAt": "2024-02-19T10:15:30.123Z",
        "isValid": true
      }
    ]
  }
}
```

### 2. Revoke Certificate

**Access:** Manager, Officer, Trainer only

**Purpose:** Invalidate a certificate (e.g., fraud detection, policy violation)

```http
PUT {{base_url}}/certificates/{{certificate_id}}/revoke
Authorization: Bearer {{trainer_token}}
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Certificate revoked successfully",
  "data": {
    "_id": "65d3f...",
    "certificateCode": "CERT-A8B9C2D1",
    "isValid": false,
    "updatedAt": "2024-02-20T14:30:00.000Z"
  }
}
```

**Error (Already Revoked):**
```json
{
  "success": false,
  "message": "Certificate is already revoked"
}
```

### 3. Get Certificate Statistics

**Access:** Manager, Officer, Trainer only

**Purpose:** View analytics about issued certificates

```http
GET {{base_url}}/certificates/stats/overview
Authorization: Bearer {{trainer_token}}
```

**Response:**
```json
{
  "success": true,
  "message": "Certificate statistics retrieved successfully",
  "data": {
    "totalCertificates": 15,
    "revokedCertificates": 2,
    "recentCertificates": 5,
    "topQuizzes": [
      {
        "_id": "65d3c...",
        "quizTitle": "Workplace Safety Fundamentals",
        "count": 8
      },
      {
        "_id": "65d4a...",
        "quizTitle": "Fire Safety Training",
        "count": 5
      }
    ]
  }
}
```

---

## Complete Testing Workflow

### Full End-to-End Test

```javascript
// 1. TRAINER: Create Quiz
POST /api/quizzes (trainer_token)
→ Get quiz_id

// 2. TRAINER: Add 4 Questions
POST /api/quizzes/{{quiz_id}}/questions (trainer_token) × 4
→ Questions with 4 answers each

// 3. WORKER: Login
POST /api/users/login
→ Get worker_token

// 4. WORKER: View Available Quizzes
GET /api/quizzes (worker_token)

// 5. WORKER: Take Quiz (Pass with 70%+)
POST /api/quiz-attempts (worker_token)
→ Certificate auto-generated
→ Get certificate_code

// 6. WORKER: View My Certificates
GET /api/certificates/my-certificates (worker_token)
→ See new certificate

// 7. PUBLIC: Verify Certificate
GET /api/certificates/verify/{{certificate_code}} (NO AUTH)
→ Verify authenticity

// 8. TRAINER: View All Certificates
GET /api/certificates (trainer_token)

// 9. TRAINER: View Statistics
GET /api/certificates/stats/overview (trainer_token)

// 10. TRAINER: Revoke Certificate (if needed)
PUT /api/certificates/{{certificate_id}}/revoke (trainer_token)
```

---

## Error Scenarios

### 1. Worker Tries to View Another User's Certificate
```http
GET {{base_url}}/certificates/{{other_user_certificate_id}}
Authorization: Bearer {{worker_token}}
```

**Response:**
```json
{
  "success": false,
  "message": "Not authorized to view this certificate"
}
```

### 2. Failed Quiz (No Certificate Generated)
```http
POST {{base_url}}/quiz-attempts
Authorization: Bearer {{worker_token}}
Content-Type: application/json

{
  "quizId": "{{quiz_id}}",
  "startedAt": "2024-02-19T10:00:00.000Z",
  "answers": [
    { "selectedAnswer": 0 },
    { "selectedAnswer": 0 },
    { "selectedAnswer": 0 },
    { "selectedAnswer": 0 }
  ]
}
```

**Response (if score < passMark):**
```json
{
  "success": true,
  "message": "Quiz completed. Keep practicing!",
  "data": {
    "attempt": {
      "score": 10,
      "percentage": 25,
      "passed": false
    },
    "certificate": null
  }
}
```

### 3. Worker Tries to Access Admin Endpoint
```http
GET {{base_url}}/certificates
Authorization: Bearer {{worker_token}}
```

**Response:**
```json
{
  "success": false,
  "message": "User role worker is not authorized to access this route"
}
```

### 4. Invalid Certificate Code
```http
GET {{base_url}}/certificates/verify/CERT-INVALID123
```

**Response:**
```json
{
  "success": false,
  "message": "Certificate not found. Invalid certificate code.",
  "data": {
    "isValid": false
  }
}
```

### 5. Duplicate Certificate Prevention
If user passes same quiz again:
```http
POST {{base_url}}/quiz-attempts (same quiz, passing score)
```

**Response:**
```json
{
  "success": true,
  "message": "Congratulations! You passed the quiz! A certificate has been generated.",
  "data": {
    "attempt": { ... },
    "certificate": {
      "certificateCode": "CERT-A8B9C2D1",  // Same certificate code
      "issuedAt": "2024-02-19T10:15:30.123Z"  // Original issue date
    }
  }
}
```

**Note:** System returns existing certificate, doesn't create duplicate

---

## Testing Checklist

### Certificate Auto-Generation
- [ ] Certificate generated when worker passes quiz (≥ passMark)
- [ ] No certificate generated when worker fails quiz (< passMark)
- [ ] Certificate code is unique and uppercase
- [ ] Certificate contains correct user info (name, email)
- [ ] Certificate contains correct quiz info (title, score, percentage)
- [ ] Duplicate prevention: passing same quiz again returns existing certificate

### Certificate Retrieval
- [ ] Worker can view their own certificates
- [ ] Worker cannot view other users' certificates
- [ ] Admin can view any certificate
- [ ] Certificates sorted by issue date (newest first)
- [ ] Only valid certificates appear in my-certificates

### Public Verification
- [ ] No authentication required for verification endpoint
- [ ] Valid certificate shows full details
- [ ] Invalid code returns `isValid: false`
- [ ] Revoked certificate shows revoked status
- [ ] Expired certificate shows expired status

### Admin Management
- [ ] Only admin roles can access admin endpoints
- [ ] Get all certificates works with filters (userId, quizId, isValid)
- [ ] Certificate revocation works correctly
- [ ] Already revoked certificate returns error
- [ ] Statistics show accurate counts
- [ ] Top quizzes sorted by certificate count

### Edge Cases
- [ ] Certificate generation doesn't fail quiz attempt
- [ ] Certificate code never duplicates
- [ ] Certificate persists after quiz deletion (quiz ID preserved)
- [ ] Certificate verification case-insensitive (CERT-ABC = cert-abc)

---

## API Endpoints Quick Reference

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/certificates/my-certificates` | Private (All) | Get current user's certificates |
| GET | `/certificates/:id` | Private (Owner/Admin) | Get certificate by ID |
| GET | `/certificates/verify/:code` | **Public** | Verify certificate authenticity |
| GET | `/certificates` | Admin | Get all certificates (with filters) |
| PUT | `/certificates/:id/revoke` | Admin | Revoke a certificate |
| GET | `/certificates/stats/overview` | Admin | Get certificate statistics |

**Admin Roles:** Manager, Officer, Trainer

---

## Notes

### Certificate Code Format
- Format: `CERT-XXXXXXXX`
- 8 random alphanumeric characters (uppercase)
- Guaranteed unique via database check
- Example: `CERT-A8B9C2D1`

### Certificate Lifecycle
1. **Issued** - Worker passes quiz (percentage ≥ passMark)
2. **Valid** - `isValid: true`, available for verification
3. **Revoked** - Admin sets `isValid: false`, verification shows revoked
4. **Expired** - `expiresAt` date passed (if set), verification shows expired

### Security Features
- Public verification endpoint (no auth required)
- Owner + Admin authorization for certificate details
- Duplicate prevention (one certificate per user per quiz)
- Certificate validity tracking
- Revocation capability for fraud prevention

### Integration Points
- **Quiz Attempt Submission** - Auto-generates certificate if passed
- **User Model** - References user who earned certificate
- **Quiz Model** - References quiz that certificate was earned for

---

## Future Enhancements (SendGrid Email)

Once SendGrid is integrated:
```javascript
// After certificate generation
if (passed && certificate) {
  // Send email with certificate attached
  await sendCertificateEmail({
    to: user.email,
    userName: user.firstName,
    certificateCode: certificate.certificateCode,
    quizTitle: quiz.title,
    score: percentage
  });
}
```

**Testing with SendGrid:**
- [ ] Email sent immediately after certificate generation
- [ ] Email contains certificate download link/PDF
- [ ] Email includes certificate code for verification
- [ ] Email template styled professionally

---

**Happy Testing! 🎓**

For quiz testing, see [QUIZ_POSTMAN_GUIDE.md](./QUIZ_POSTMAN_GUIDE.md)
