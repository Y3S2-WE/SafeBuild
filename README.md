# SafeBuild 🏗️

**Occupational Safety Training, Certification & Reporting Web App**

A comprehensive web application designed to improve workplace safety in the construction industry by providing digital training, certification, hazard reporting, and compliance monitoring tools.

## 🎯 SDG Goal
**Decent Work and Economic Growth** - Promoting safe and secure working environments for all workers.

### Assigned Topic 
A web app to ensure occupational safety with certification through digital training & reporting.

## 🏷️ Project Overview

### Domain
Construction Company

### System
Occupational Safety Training, Certification & Reporting Web App

### Purpose
The system aims to improve workplace safety by providing digital training, certification, hazard reporting, and compliance monitoring tools.

### Target Users
- 👷 **Construction Workers**: Access training, report incidents, complete assignments
- 👨‍💼 **Site Managers**: Oversee operations, manage incidents, track compliance
- 🛡️ **Safety Officers**: Conduct audits, issue corrective actions, monitor safety metrics
- 👨‍🏫 **Trainers**: Create courses, manage assessments, issue certifications

## 📦 System Components

### ✅ Component 1: Training Course Manager + User Management
- User registration and authentication with role-based access control
- Course creation and management (trainers)
- Lesson organization and content delivery
- User enrollment tracking and progress monitoring

### ✅ Component 2: Assessment & Certification System
- Interactive quizzes and assessments
- Automated grading with instant feedback
- Digital certificate generation and verification
- Certification tracking with expiry management

### ✅ Component 3: Incident & Hazard Reporting
- Real-time incident reporting with severity classification
- Hazard identification and documentation
- Photo/evidence upload support
- Status tracking and assignment workflow

### ✅ Component 4: Compliance Auditing & Corrective Actions
- Safety audit scheduling with checklist templates
- Compliance score calculation and tracking
- Corrective action creation and assignment
- Follow-up management and completion verification

## 🛠️ Technology Stack

### Backend
- **Framework**: Express.js (Node.js)
- **Database**: MongoDB Atlas
- **ODM**: Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: bcryptjs, CORS
- **Dev Tools**: nodemon

### Frontend
- To be determined

---

## 🚀 Setup Instructions

### Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **MongoDB Atlas account** - [Sign up here](https://www.mongodb.com/cloud/atlas)
- **Git** (for cloning the repository)

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/SafeBuild.git
cd SafeBuild
```

### Step 2: Backend Setup

#### 2.1 Navigate to Backend Directory
```bash
cd backend
```

#### 2.2 Install Dependencies
```bash
npm install
```

This will install all required packages:
- express
- mongoose
- dotenv
- cors
- bcryptjs
- jsonwebtoken
- express-validator
- nodemon (dev dependency)

#### 2.3 Configure Environment Variables

Create a `.env` file in the backend directory:
```bash
touch .env
```

Add the following environment variables to `.env`:
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/safebuild?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d

# Optional: Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000
```


#### 2.4 Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and update `MONGODB_URI` in `.env`

#### 2.5 Start the Development Server

Run the server with auto-reload on file changes:
```bash
npm run dev
```

Or run in production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

#### 2.6 Verify Installation

Check if the server is running:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "SafeBuild API is running",
  "timestamp": "2026-02-27T10:30:00.000Z",
  "environment": "development"
}
```

### Step 3: Testing the API

You can test the API using:
- **Postman** - [Download here](https://www.postman.com/)
- **Thunder Client** (VS Code extension)
- **cURL** (command line)
- **Any HTTP client**

### Step 4: Initial User Registration

Create your first user account:
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "manager",
    "phone": "+94771234567",
    "employeeId": "EMP001"
  }'
```

---

## 📚 API Endpoint Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### User Roles & Permissions
- **worker**: Basic access, can view published courses, report incidents
- **trainer**: Can create/manage courses, quizzes, and certifications
- **officer**: Can conduct audits, manage corrective actions, view all incidents
- **manager**: Full access to all resources including user management

---

## 🔐 Component 1: User Management & Authentication

### 1.1 Register User
**Endpoint**: `POST /api/users/register`  
**Access**: Public  
**Description**: Register a new user account

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "role": "worker",
  "phone": "+94771234567",
  "employeeId": "EMP001",
  "department": "Construction"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "worker",
      "phone": "+94771234567",
      "employeeId": "EMP001",
      "department": "Construction"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.2 Login User
**Endpoint**: `POST /api/users/login`  
**Access**: Public  
**Description**: Authenticate user and receive JWT token

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "worker",
      "phone": "+94771234567",
      "employeeId": "EMP001",
      "department": "Construction"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.3 Get User Profile
**Endpoint**: `GET /api/users/profile`  
**Access**: Private (All authenticated users)  
**Authentication**: Required  
**Description**: Get current user's profile information

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "worker",
    "phone": "+94771234567",
    "employeeId": "EMP001",
    "department": "Construction",
    "isActive": true,
    "createdAt": "2026-02-15T10:30:00.000Z"
  }
}
```

### 1.4 Get All Users
**Endpoint**: `GET /api/users`  
**Access**: Private (Manager, Officer, Trainer)  
**Authentication**: Required  
**Description**: Retrieve list of all users (admin only)

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "worker",
      "department": "Construction",
      "isActive": true
    }
  ]
}
```

---

## 📖 Component 1: Course Management

### 2.1 Create Course
**Endpoint**: `POST /api/courses`  
**Access**: Private (Trainer only)  
**Authentication**: Required  
**Description**: Create a new training course

**Request Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "title": "Construction Site Safety Fundamentals",
  "category": "Safety Training",
  "description": "Comprehensive course covering basic safety protocols and procedures for construction sites",
  "level": "Beginner",
  "duration": 120,
  "status": "Draft"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "_id": "65f2a3b4c5d6e7f8g9h0i1j2",
    "title": "Construction Site Safety Fundamentals",
    "category": "Safety Training",
    "description": "Comprehensive course covering basic safety protocols...",
    "level": "Beginner",
    "duration": 120,
    "status": "Draft",
    "createdBy": "65f1a2b3c4d5e6f7g8h9i0j1",
    "createdAt": "2026-02-27T10:00:00.000Z",
    "updatedAt": "2026-02-27T10:00:00.000Z"
  }
}
```

### 2.2 Get All Courses
**Endpoint**: `GET /api/courses`  
**Access**: Private (All authenticated users)  
**Authentication**: Required  
**Description**: Retrieve list of courses (workers see only published courses)

**Query Parameters**:
- `category` (optional): Filter by category
- `level` (optional): Filter by difficulty level
- `status` (optional): Filter by status (Draft/Published/Archived)
- `search` (optional): Search in title and description

**Request Headers**:
```
Authorization: Bearer <token>
```

**Example Request**:
```
GET /api/courses?status=Published&level=Beginner
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "65f2a3b4c5d6e7f8g9h0i1j2",
      "title": "Construction Site Safety Fundamentals",
      "category": "Safety Training",
      "description": "Comprehensive course covering basic safety protocols...",
      "level": "Beginner",
      "duration": 120,
      "status": "Published",
      "createdBy": {
        "name": "Jane Trainer",
        "email": "jane@safebuild.com"
      },
      "createdAt": "2026-02-27T10:00:00.000Z"
    }
  ]
}
```

### 2.3 Get Single Course
**Endpoint**: `GET /api/courses/:id`  
**Access**: Private (All authenticated users)  
**Authentication**: Required  
**Description**: Get detailed information about a specific course including lessons

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "course": {
      "_id": "65f2a3b4c5d6e7f8g9h0i1j2",
      "title": "Construction Site Safety Fundamentals",
      "category": "Safety Training",
      "description": "Comprehensive course covering basic safety protocols...",
      "level": "Beginner",
      "duration": 120,
      "status": "Published",
      "createdBy": {
        "name": "Jane Trainer",
        "email": "jane@safebuild.com"
      }
    },
    "lessons": [
      {
        "_id": "65f3a4b5c6d7e8f9g0h1i2j3",
        "title": "Introduction to Workplace Safety",
        "orderIndex": 1,
        "content": "Safety is paramount...",
        "duration": 30
      }
    ]
  }
}
```

### 2.4 Update Course
**Endpoint**: `PUT /api/courses/:id`  
**Access**: Private (Trainer only - must own the course)  
**Authentication**: Required  
**Description**: Update course details

**Request Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "title": "Advanced Construction Site Safety",
  "status": "Published",
  "duration": 150
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "65f2a3b4c5d6e7f8g9h0i1j2",
    "title": "Advanced Construction Site Safety",
    "status": "Published",
    "duration": 150,
    "updatedAt": "2026-02-27T11:00:00.000Z"
  }
}
```

### 2.5 Delete Course
**Endpoint**: `DELETE /api/courses/:id`  
**Access**: Private (Trainer only - must own the course)  
**Authentication**: Required  
**Description**: Delete a course

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

---

## 🎯 Component 2: Quiz & Assessment

### 3.1 Create Quiz
**Endpoint**: `POST /api/quizzes`  
**Access**: Private (Trainer only)  
**Authentication**: Required  
**Description**: Create a new quiz for a course

**Request Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "courseId": "65f2a3b4c5d6e7f8g9h0i1j2",
  "title": "Safety Fundamentals Assessment",
  "description": "Test your knowledge of basic safety protocols",
  "passingScore": 70,
  "timeLimit": 30,
  "questions": [
    {
      "questionText": "What is the first step in case of a fire?",
      "questionType": "multiple-choice",
      "options": [
        "Call for help",
        "Use fire extinguisher",
        "Evacuate immediately",
        "Take photos"
      ],
      "correctAnswer": "Evacuate immediately",
      "points": 10
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Quiz created successfully",
  "data": {
    "_id": "65f4a5b6c7d8e9f0g1h2i3j4",
    "courseId": "65f2a3b4c5d6e7f8g9h0i1j2",
    "title": "Safety Fundamentals Assessment",
    "description": "Test your knowledge of basic safety protocols",
    "passingScore": 70,
    "timeLimit": 30,
    "questions": [ /* questions array */ ],
    "createdBy": "65f1a2b3c4d5e6f7g8h9i0j1",
    "createdAt": "2026-02-27T12:00:00.000Z"
  }
}
```

### 3.2 Get All Quizzes
**Endpoint**: `GET /api/quizzes`  
**Access**: Private (All authenticated users)  
**Authentication**: Required  
**Description**: Get list of all quizzes

**Query Parameters**:
- `courseId` (optional): Filter by course

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "65f4a5b6c7d8e9f0g1h2i3j4",
      "courseId": "65f2a3b4c5d6e7f8g9h0i1j2",
      "title": "Safety Fundamentals Assessment",
      "passingScore": 70,
      "timeLimit": 30
    }
  ]
}
```

### 3.3 Get Quiz by ID
**Endpoint**: `GET /api/quizzes/:id`  
**Access**: Private (All authenticated users)  
**Authentication**: Required  
**Description**: Get detailed quiz information including questions

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "65f4a5b6c7d8e9f0g1h2i3j4",
    "courseId": "65f2a3b4c5d6e7f8g9h0i1j2",
    "title": "Safety Fundamentals Assessment",
    "description": "Test your knowledge of basic safety protocols",
    "passingScore": 70,
    "timeLimit": 30,
    "questions": [
      {
        "_id": "65f5a6b7c8d9e0f1g2h3i4j5",
        "questionText": "What is the first step in case of a fire?",
        "questionType": "multiple-choice",
        "options": ["Call for help", "Use fire extinguisher", "Evacuate immediately", "Take photos"],
        "correctAnswer": "Evacuate immediately",
        "points": 10
      }
    ]
  }
}
```

### 3.4 Update Quiz
**Endpoint**: `PUT /api/quizzes/:id`  
**Access**: Private (Trainer only)  
**Authentication**: Required  
**Description**: Update quiz details

**Request Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "title": "Safety Fundamentals Final Assessment",
  "passingScore": 75
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Quiz updated successfully",
  "data": { /* updated quiz */ }
}
```

### 3.5 Delete Quiz
**Endpoint**: `DELETE /api/quizzes/:id`  
**Access**: Private (Trainer only)  
**Authentication**: Required  
**Description**: Delete a quiz

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Quiz deleted successfully"
}
```

---

## 🎓 Component 2: Certificates

### 4.1 Get My Certificates
**Endpoint**: `GET /api/certificates/my-certificates`  
**Access**: Private (All authenticated users)  
**Authentication**: Required  
**Description**: Get all certificates earned by current user

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "65f6a7b8c9d0e1f2g3h4i5j6",
      "userId": "65f1a2b3c4d5e6f7g8h9i0j1",
      "courseId": {
        "_id": "65f2a3b4c5d6e7f8g9h0i1j2",
        "title": "Construction Site Safety Fundamentals"
      },
      "certificateCode": "CERT-2026-ABC123",
      "issueDate": "2026-02-27T15:00:00.000Z",
      "expiryDate": "2027-02-27T15:00:00.000Z",
      "status": "Active"
    }
  ]
}
```

### 4.2 Verify Certificate
**Endpoint**: `GET /api/certificates/verify/:code`  
**Access**: Public  
**Description**: Verify certificate authenticity by code

**Example Request**:
```
GET /api/certificates/verify/CERT-2026-ABC123
```

**Response** (200 OK):
```json
{
  "success": true,
  "valid": true,
  "data": {
    "certificateCode": "CERT-2026-ABC123",
    "userName": "John Doe",
    "courseName": "Construction Site Safety Fundamentals",
    "issueDate": "2026-02-27T15:00:00.000Z",
    "expiryDate": "2027-02-27T15:00:00.000Z",
    "status": "Active"
  }
}
```

---

## 🚨 Component 3: Incident & Hazard Reporting

### 5.1 Create Incident Report
**Endpoint**: `POST /api/incidents`  
**Access**: Private (All authenticated users)  
**Authentication**: Required  
**Description**: Report a new incident or hazard

**Request Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "title": "Fall from scaffolding",
  "type": "Accident",
  "severity": "High",
  "location": {
    "site": "Main Construction Site",
    "area": "Building A - 3rd Floor",
    "address": "123 Construction Ave, Colombo"
  },
  "description": "Worker slipped and fell from scaffolding due to wet surface",
  "dateOccurred": "2026-02-27T09:30:00.000Z",
  "evidencePhotos": [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg"
  ],
  "assignedTo": "65f7a8b9c0d1e2f3g4h5i6j7"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Incident reported successfully",
  "data": {
    "_id": "65f8a9b0c1d2e3f4g5h6i7j8",
    "title": "Fall from scaffolding",
    "type": "Accident",
    "severity": "High",
    "status": "Open",
    "location": {
      "site": "Main Construction Site",
      "area": "Building A - 3rd Floor",
      "address": "123 Construction Ave, Colombo"
    },
    "description": "Worker slipped and fell from scaffolding...",
    "dateOccurred": "2026-02-27T09:30:00.000Z",
    "reportedBy": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "reportedByName": "John Doe",
    "assignedTo": {
      "firstName": "Sarah",
      "lastName": "Officer",
      "email": "sarah@safebuild.com",
      "role": "officer"
    },
    "evidencePhotos": ["https://example.com/photo1.jpg"],
    "createdAt": "2026-02-27T10:00:00.000Z"
  }
}
```

### 5.2 Get All Incidents
**Endpoint**: `GET /api/incidents`  
**Access**: Private (All authenticated users)  
**Authentication**: Required  
**Description**: Get list of incidents (workers see only their own)

**Query Parameters**:
- `status` (optional): Filter by status (Open/In Progress/Resolved/Closed)
- `severity` (optional): Filter by severity (Low/Medium/High/Critical)
- `type` (optional): Filter by type (Near Miss/Accident/Hazard/Equipment Failure)
- `search` (optional): Search in title, description, location
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Request Headers**:
```
Authorization: Bearer <token>
```

**Example Request**:
```
GET /api/incidents?status=Open&severity=High&page=1&limit=10
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 15,
  "total": 45,
  "page": 1,
  "pages": 5,
  "data": [
    {
      "_id": "65f8a9b0c1d2e3f4g5h6i7j8",
      "title": "Fall from scaffolding",
      "type": "Accident",
      "severity": "High",
      "status": "Open",
      "location": {
        "site": "Main Construction Site",
        "area": "Building A - 3rd Floor"
      },
      "dateOccurred": "2026-02-27T09:30:00.000Z",
      "reportedBy": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "createdAt": "2026-02-27T10:00:00.000Z"
    }
  ]
}
```

### 5.3 Get Incident by ID
**Endpoint**: `GET /api/incidents/:id`  
**Access**: Private (All authenticated users)  
**Authentication**: Required  
**Description**: Get detailed information about a specific incident

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "65f8a9b0c1d2e3f4g5h6i7j8",
    "title": "Fall from scaffolding",
    "type": "Accident",
    "severity": "High",
    "status": "In Progress",
    "location": {
      "site": "Main Construction Site",
      "area": "Building A - 3rd Floor",
      "address": "123 Construction Ave, Colombo"
    },
    "description": "Worker slipped and fell from scaffolding...",
    "dateOccurred": "2026-02-27T09:30:00.000Z",
    "reportedBy": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "assignedTo": {
      "firstName": "Sarah",
      "lastName": "Officer",
      "email": "sarah@safebuild.com"
    },
    "evidencePhotos": ["https://example.com/photo1.jpg"],
    "comments": [
      {
        "text": "Investigation started",
        "addedBy": "Sarah Officer",
        "addedAt": "2026-02-27T11:00:00.000Z"
      }
    ],
    "createdAt": "2026-02-27T10:00:00.000Z",
    "updatedAt": "2026-02-27T11:00:00.000Z"
  }
}
```

### 5.4 Update Incident
**Endpoint**: `PUT /api/incidents/:id`  
**Access**: Private (Owner or Manager/Officer)  
**Authentication**: Required  
**Description**: Update incident details

**Request Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "description": "Updated description with more details",
  "severity": "Critical"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Incident updated successfully",
  "data": { /* updated incident */ }
}
```

### 5.5 Delete Incident
**Endpoint**: `DELETE /api/incidents/:id`  
**Access**: Private (Owner or Manager/Officer)  
**Authentication**: Required  
**Description**: Delete an incident report

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Incident deleted successfully"
}
```

---

## ✅ Component 4: Compliance Auditing

### 6.1 Create/Schedule Audit
**Endpoint**: `POST /api/audits`  
**Access**: Private (Manager, Officer only)  
**Authentication**: Required  
**Description**: Schedule a new compliance audit

**Request Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "site": "Main Construction Site - Building A",
  "auditDate": "2026-03-01T09:00:00.000Z",
  "checklistTemplate": "65f9a0b1c2d3e4f5g6h7i8j9",
  "assignedAuditor": "65f7a8b9c0d1e2f3g4h5i6j7"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Audit scheduled successfully",
  "data": {
    "_id": "65f0a1b2c3d4e5f6g7h8i9j0",
    "site": "Main Construction Site - Building A",
    "auditDate": "2026-03-01T09:00:00.000Z",
    "status": "Scheduled",
    "checklistTemplate": {
      "_id": "65f9a0b1c2d3e4f5g6h7i8j9",
      "title": "General Site Safety Audit",
      "category": "Safety"
    },
    "assignedAuditor": {
      "firstName": "Sarah",
      "lastName": "Officer",
      "email": "sarah@safebuild.com"
    },
    "createdBy": {
      "firstName": "Manager",
      "lastName": "User"
    },
    "complianceScore": null,
    "createdAt": "2026-02-27T14:00:00.000Z"
  }
}
```

### 6.2 Get All Audits
**Endpoint**: `GET /api/audits`  
**Access**: Private (All authenticated users)  
**Authentication**: Required  
**Description**: Get list of all audits

**Query Parameters**:
- `status` (optional): Filter by status (Scheduled/In Progress/Completed/Cancelled)
- `site` (optional): Filter by site name
- `assignedAuditor` (optional): Filter by auditor ID
- `startDate` (optional): Filter audits from this date
- `endDate` (optional): Filter audits until this date

**Request Headers**:
```
Authorization: Bearer <token>
```

**Example Request**:
```
GET /api/audits?status=Scheduled&startDate=2026-03-01
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "_id": "65f0a1b2c3d4e5f6g7h8i9j0",
      "site": "Main Construction Site - Building A",
      "auditDate": "2026-03-01T09:00:00.000Z",
      "status": "Scheduled",
      "checklistTemplate": {
        "_id": "65f9a0b1c2d3e4f5g6h7i8j9",
        "title": "General Site Safety Audit",
        "category": "Safety"
      },
      "assignedAuditor": {
        "firstName": "Sarah",
        "lastName": "Officer"
      },
      "complianceScore": null,
      "createdAt": "2026-02-27T14:00:00.000Z"
    }
  ]
}
```

### 6.3 Get Audit by ID
**Endpoint**: `GET /api/audits/:id`  
**Access**: Private (All authenticated users)  
**Authentication**: Required  
**Description**: Get detailed audit information

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "65f0a1b2c3d4e5f6g7h8i9j0",
    "site": "Main Construction Site - Building A",
    "auditDate": "2026-03-01T09:00:00.000Z",
    "status": "Completed",
    "checklistTemplate": {
      "_id": "65f9a0b1c2d3e4f5g6h7i8j9",
      "title": "General Site Safety Audit",
      "category": "Safety",
      "items": [
        {
          "category": "PPE Compliance",
          "checkItems": [
            "Hard hats worn by all personnel",
            "Safety vests visible",
            "Proper footwear in use"
          ]
        }
      ]
    },
    "responses": [
      {
        "category": "PPE Compliance",
        "itemResponses": [
          {
            "item": "Hard hats worn by all personnel",
            "status": "Pass",
            "notes": "All workers compliant"
          },
          {
            "item": "Safety vests visible",
            "status": "Fail",
            "notes": "2 workers without vests"
          }
        ]
      }
    ],
    "complianceScore": 85,
    "findings": "Minor non-compliance issues identified",
    "correctiveActionsCount": 2,
    "assignedAuditor": {
      "firstName": "Sarah",
      "lastName": "Officer",
      "email": "sarah@safebuild.com",
      "role": "officer"
    },
    "createdBy": {
      "firstName": "Manager",
      "lastName": "User"
    },
    "completedAt": "2026-03-01T12:00:00.000Z",
    "createdAt": "2026-02-27T14:00:00.000Z"
  }
}
```

### 6.4 Update Audit
**Endpoint**: `PUT /api/audits/:id`  
**Access**: Private (Manager, Officer only)  
**Authentication**: Required  
**Description**: Update audit details or submit responses

**Request Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "status": "Completed",
  "responses": [
    {
      "category": "PPE Compliance",
      "itemResponses": [
        {
          "item": "Hard hats worn by all personnel",
          "status": "Pass",
          "notes": "All workers compliant"
        }
      ]
    }
  ],
  "complianceScore": 85,
  "findings": "Minor non-compliance issues identified"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Audit updated successfully",
  "data": { /* updated audit */ }
}
```

### 6.5 Delete Audit
**Endpoint**: `DELETE /api/audits/:id`  
**Access**: Private (Manager only)  
**Authentication**: Required  
**Description**: Delete an audit

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Audit deleted successfully"
}
```

---

## 🔧 Component 4: Corrective Actions

### 7.1 Create Corrective Action
**Endpoint**: `POST /api/corrective-actions`  
**Access**: Private (Manager, Officer only)  
**Authentication**: Required  
**Description**: Create a new corrective action

**Request Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "title": "Install additional safety railings",
  "description": "Install safety railings on 3rd floor scaffolding area",
  "priority": "High",
  "dueDate": "2026-03-15T17:00:00.000Z",
  "assignedTo": "65f1a2b3c4d5e6f7g8h9i0j1",
  "audit": "65f0a1b2c3d4e5f6g7h8i9j0",
  "relatedIncident": "65f8a9b0c1d2e3f4g5h6i7j8"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Corrective action created successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j2",
    "title": "Install additional safety railings",
    "description": "Install safety railings on 3rd floor scaffolding area",
    "priority": "High",
    "status": "Pending",
    "dueDate": "2026-03-15T17:00:00.000Z",
    "assignedTo": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "audit": "65f0a1b2c3d4e5f6g7h8i9j0",
    "relatedIncident": "65f8a9b0c1d2e3f4g5h6i7j8",
    "createdBy": {
      "firstName": "Sarah",
      "lastName": "Officer"
    },
    "createdAt": "2026-02-27T15:00:00.000Z"
  }
}
```

### 7.2 Get All Corrective Actions
**Endpoint**: `GET /api/corrective-actions`  
**Access**: Private (Manager, Officer, Worker - filtered)  
**Authentication**: Required  
**Description**: Get list of corrective actions (workers see only their assigned actions)

**Query Parameters**:
- `status` (optional): Filter by status (Pending/In Progress/Completed/Overdue)
- `priority` (optional): Filter by priority (Low/Medium/High/Critical)
- `assignedTo` (optional): Filter by assigned user ID

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "_id": "65f1a2b3c4d5e6f7g8h9i0j2",
      "title": "Install additional safety railings",
      "description": "Install safety railings on 3rd floor scaffolding area",
      "priority": "High",
      "status": "Pending",
      "dueDate": "2026-03-15T17:00:00.000Z",
      "assignedTo": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "createdBy": {
        "firstName": "Sarah",
        "lastName": "Officer"
      },
      "createdAt": "2026-02-27T15:00:00.000Z"
    }
  ]
}
```

### 7.3 Update Corrective Action
**Endpoint**: `PUT /api/corrective-actions/:id`  
**Access**: Private (Manager, Officer, Assigned Worker)  
**Authentication**: Required  
**Description**: Update corrective action (workers can update status and completion notes)

**Request Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "status": "Completed",
  "completionNotes": "Safety railings installed and inspected. Passed safety check.",
  "completedDate": "2026-03-10T16:00:00.000Z"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Corrective action updated successfully",
  "data": { /* updated corrective action */ }
}
```

### 7.4 Delete Corrective Action
**Endpoint**: `DELETE /api/corrective-actions/:id`  
**Access**: Private (Manager only)  
**Authentication**: Required  
**Description**: Delete a corrective action

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Corrective action deleted successfully"
}
```

---

## 📝 Additional Endpoints

### Checklist Templates

**Endpoint**: `POST /api/checklists`  
**Access**: Private (Manager, Officer)  
**Description**: Create audit checklist template

**Endpoint**: `GET /api/checklists`  
**Access**: Private (All authenticated)  
**Description**: Get all checklist templates

**Endpoint**: `GET /api/checklists/:id`  
**Access**: Private (All authenticated)  
**Description**: Get specific checklist template

**Endpoint**: `PUT /api/checklists/:id`  
**Access**: Private (Manager, Officer)  
**Description**: Update checklist template

**Endpoint**: `DELETE /api/checklists/:id`  
**Access**: Private (Manager)  
**Description**: Delete checklist template

### Enrollments

**Endpoint**: `POST /api/enrollments`  
**Access**: Private (All authenticated)  
**Description**: Enroll in a course

**Endpoint**: `GET /api/enrollments`  
**Access**: Private (All authenticated)  
**Description**: Get user enrollments

**Endpoint**: `GET /api/enrollments/:id`  
**Access**: Private (All authenticated)  
**Description**: Get specific enrollment

**Endpoint**: `PUT /api/enrollments/:id`  
**Access**: Private (All authenticated)  
**Description**: Update enrollment progress

### Quiz Attempts

**Endpoint**: `POST /api/quiz-attempts`  
**Access**: Private (All authenticated)  
**Description**: Submit quiz attempt

**Endpoint**: `GET /api/quiz-attempts`  
**Access**: Private (All authenticated)  
**Description**: Get user's quiz attempts

**Endpoint**: `GET /api/quiz-attempts/:id`  
**Access**: Private (All authenticated)  
**Description**: Get specific quiz attempt

---

## ⚠️ Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized, token failed or missing"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "User role not authorized to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Server error message",
  "error": "Detailed error (development mode only)"
}
```

---

## 🔒 Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs before storage
- **JWT Authentication**: Secure token-based authentication system
- **Role-Based Access Control**: Four user roles with different permission levels
- **Input Validation**: Request validation using express-validator
- **CORS Protection**: Cross-Origin Resource Sharing configured
- **Environment Variables**: Sensitive data stored in .env file

---

## 📊 Database Models

### User Model
- firstName, lastName, email, password
- role (worker/manager/officer/trainer)
- phone, employeeId, department
- isActive status

### Course Model
- title, category, description
- level (Beginner/Intermediate/Advanced)
- duration, status (Draft/Published/Archived)
- createdBy (trainer reference)

### Quiz Model
- courseId reference
- title, description, questions array
- passingScore, timeLimit
- createdBy (trainer reference)

### Incident Model
- title, type, severity, status
- location (site, area, address)
- description, evidencePhotos
- reportedBy, assignedTo references
- dateOccurred, comments array

### Audit Model
- site, auditDate, status
- checklistTemplate reference
- assignedAuditor, createdBy references
- responses array, complianceScore
- findings, completedAt

### Corrective Action Model
- title, description, priority, status
- dueDate, assignedTo reference
- audit, relatedIncident references
- completionNotes, completedDate

---

## 🧪 Testing

### Using cURL
```bash
# Register a new user
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"test123","role":"worker"}'

# Login
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get profile (requires token)
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman
1. Import the collection (if provided)
2. Set environment variable `baseURL` to `http://localhost:5000/api`
3. After login, set `token` variable with the received JWT
4. Use `{{baseURL}}` and `{{token}}` in requests

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Cannot connect to MongoDB  
**Solution**: Check your MongoDB URI in `.env`, ensure IP whitelist is configured

**Issue**: "Token expired" error  
**Solution**: Login again to get a new token

**Issue**: Port 5000 already in use  
**Solution**: Change PORT in `.env` or kill the process using port 5000

**Issue**: Module not found errors  
**Solution**: Run `npm install` again to ensure all dependencies are installed

**Issue**: Validation errors on registration  
**Solution**: Ensure all required fields are provided with correct formats

---

## 📄 License

This project is licensed under the ISC License.

---

## 👥 Contributors

SafeBuild Development Team

---

## 📞 Support

For issues and questions:
- Create an issue in the GitHub repository
- Contact the development team

---

**Last Updated**: February 27, 2026
   npm run dev
   ```

5. **Verify the API is running:**
   
   Open your browser and navigate to: `http://localhost:5000/api/health`
   
   You should see a JSON response confirming the API is running.

### MongoDB Setup Status
✅ MongoDB Atlas connection configured  
✅ Database configuration file created  
✅ Environment variables set up  
✅ Connection handling and error management implemented  

## 📁 Project Structure

```
SafeBuild/
├── backend/
│   ├── config/          # Configuration files
│   │   └── db.js        # MongoDB connection
│   ├── controllers/     # Route controllers
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   ├── .env             # Environment variables (not in git)
│   ├── .env.example     # Environment template
│   ├── server.js        # Application entry point
│   ├── package.json     # Dependencies
│   └── README.md        # Backend documentation
├── frontend/            # Frontend application (TBD)
└── README.md            # This file
```

## 🔐 Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
```

## 📚 API Documentation

API documentation will be available via Postman collection (to be created).

### Base URL
```
http://localhost:5000/api
```

### Available Endpoints

#### Health Check
- `GET /api/health` - Check API status

*(Additional endpoints will be documented as they are implemented)*

## 👥 Development Team

Year 03 - BSc (Hons) in Information Technology  
Specialized in Software Engineering

## 📝 Assignment Details

**Course**: SE3040 – Application Frameworks  
**Assignment**: Full Stack Application Development  
**Academic Year**: 2026

