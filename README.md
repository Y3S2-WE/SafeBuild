# SafeBuild 🏗️

**Occupational Safety Training, Certification & Reporting Web App**

A comprehensive full-stack web application designed to improve workplace safety in the construction industry by providing digital training, certification, hazard reporting, and compliance monitoring tools.

---

## 🏷️ Classification

**Course**: SE3040 – Application Frameworks  
**Assignment**: Full Stack Application Development  
**Academic Year**: 2026  
**SDG Goal**: Decent Work and Economic Growth — Promoting safe and secure working environments for all workers.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Technology Stack](#️-technology-stack)
3. [Project Structure](#-project-structure)
4. [Setup Instructions](#-setup-instructions)
5. [API Endpoint Documentation](#-api-endpoint-documentation)
6. [Deployment Report](#-deployment-report)
7. [Testing Instructions](#-testing-instructions)
8. [Security Features](#-security-features)
9. [Troubleshooting](#-troubleshooting)

---

## 🎯 Project Overview

### Domain
Construction Company

### System
Occupational Safety Training, Certification & Reporting Web App

### Target Users
| Role | Responsibilities |
|---|---|
| 👷 **Worker** | Access training, report incidents, complete quizzes |
| 👨‍💼 **Manager** | Oversee operations, manage incidents, track compliance, view analytics |
| 🛡️ **Officer** | Conduct audits, issue corrective actions, monitor safety metrics |
| 👨‍🏫 **Trainer** | Create courses and lessons, manage quizzes, issue certifications |

### System Components

| # | Component | Features |
|---|---|---|
| 1 | **Training Course Manager + User Management** | Role-based auth, course creation, lesson delivery, enrollment tracking |
| 2 | **Assessment & Certification System** | Interactive quizzes, auto-grading, digital certificates, expiry tracking |
| 3 | **Incident & Hazard Reporting** | Real-time reporting, severity classification, photo upload, status tracking |
| 4 | **Compliance Auditing & Corrective Actions** | Audit scheduling, checklist templates, corrective actions, analytics |

---

## 🛠️ Technology Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | API server and routing |
| MongoDB Atlas | Cloud database |
| Mongoose | ODM for MongoDB |
| JSON Web Tokens (JWT) | Authentication |
| bcryptjs | Password hashing |
| express-validator | Request validation |
| multer | File uploads |
| @huggingface/inference | NLLB-200 translation |
| OpenRouter (Llama 3.3 70B) | AI Safety Chatbot |
| nodemon | Dev server auto-reload |
| Jest + Supertest | Unit & integration testing |
| Artillery | Performance/load testing |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| React Router DOM v6 | Client-side routing |
| Tailwind CSS | Utility-first styling |
| Lucide React | Icon library |
| Mapbox GL JS | Interactive map picker |
| Quill / react-quill | Rich text editor |
| jsPDF | PDF certificate generation |
| DOMPurify | XSS sanitization |
| Vitest | Frontend unit testing |

---

## 📁 Project Structure

```
SafeBuild/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── courseController.js
│   │   ├── lessonController.js
│   │   ├── enrollmentController.js
│   │   ├── quizController.js
│   │   ├── quizAttemptController.js
│   │   ├── certificateController.js
│   │   ├── incidentController.js
│   │   ├── checklistController.js
│   │   ├── auditController.js
│   │   ├── correctiveActionController.js
│   │   ├── analyticsController.js
│   │   ├── chatController.js
│   │   └── translateController.js
│   ├── middleware/
│   │   ├── auth.js                  # JWT protect + authorize
│   │   ├── upload.js                # Multer config
│   │   └── validator.js             # express-validator rules
│   ├── models/
│   │   ├── User.js
│   │   ├── Course.js
│   │   ├── Lesson.js
│   │   ├── Enrollment.js
│   │   ├── Quiz.js
│   │   ├── QuizAttempt.js
│   │   ├── Certificate.js
│   │   ├── Incident.js
│   │   ├── Checklist.js
│   │   ├── Audit.js
│   │   └── CorrectiveAction.js
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── courseRoutes.js
│   │   ├── lessonRoutes.js
│   │   ├── enrollmentRoutes.js
│   │   ├── quizRoutes.js
│   │   ├── quizAttemptRoutes.js
│   │   ├── certificateRoutes.js
│   │   ├── incidentRoutes.js
│   │   ├── checklistRoutes.js
│   │   ├── auditRoutes.js
│   │   ├── correctiveActionRoutes.js
│   │   ├── analyticsRoutes.js
│   │   ├── chatRoutes.js
│   │   └── translateRoutes.js
│   ├── services/                    # Business logic services
│   ├── tests/
│   │   ├── unit/                    # Jest unit tests
│   │   ├── integration/             # Supertest integration tests
│   │   └── performance/             # Artillery load tests
│   ├── uploads/                     # Uploaded files (local dev)
│   ├── utils/                       # Utility helpers
│   ├── .env                         # Environment variables (not committed)
│   ├── .env.example                 # Environment variable template
│   ├── railway.json                 # Railway deployment config
│   ├── seed.js                      # Database seeding script
│   ├── server.js                    # Application entry point
│   └── package.json
├── frontend/
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # Route-level pages
│   │   ├── context/                 # React context (auth, etc.)
│   │   ├── services/                # API service layer
│   │   └── test/                    # Frontend test setup
│   ├── .env                         # Frontend environment variables
│   ├── .env.example                 # Frontend env variable template
│   ├── vercel.json                  # Vercel deployment config
│   ├── vite.config.js               # Vite configuration
│   └── package.json
├── DEPLOY_GUIDE.md                  # Detailed deployment guide
└── README.md                        # This file
```

---

## 🚀 Setup Instructions

### Prerequisites

Ensure the following are installed on your machine:

| Requirement | Version | Link |
|---|---|---|
| Node.js | v18 or higher | [nodejs.org](https://nodejs.org/) |
| npm | v9+ (bundled with Node) | — |
| Git | Latest | [git-scm.com](https://git-scm.com/) |
| MongoDB Atlas account | — | [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas) |

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Y3S2-WE/SafeBuild.git
cd SafeBuild
```

---

### Step 2 — Backend Setup

#### 2.1 Navigate to backend directory

```bash
cd backend
```

#### 2.2 Install dependencies

```bash
npm install
```

#### 2.3 Configure environment variables

Create the `.env` file from the provided template:

```bash
cp .env.example .env
```

Then open `.env` and fill in your values:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/safebuild?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRE=7d

# OpenRouter AI (Llama 3.3 70B) — https://openrouter.ai
OPENROUTER_API_KEY=sk-or-v1-...

# Hugging Face API (NLLB-200 Translation) — https://huggingface.co
HUGGINGFACE_API_KEY=hf_...

# Frontend URL (for CORS — in development this can stay as-is)
FRONTEND_URL=http://localhost:5173
```

#### 2.4 Set up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in
2. Create a new cluster (the free M0 tier is sufficient)
3. Under **Database Access**, create a user with read/write permissions
4. Under **Network Access**, add your IP (or `0.0.0.0/0` for development)
5. Go to **Connect → Connect your application** and copy the connection string
6. Paste it as `MONGODB_URI` in your `.env` file, replacing `<password>` and `<dbname>` with `safebuild`

#### 2.5 (Optional) Seed the database

To populate the database with sample data:

```bash
npm run seed
```

#### 2.6 Start the development server

```bash
npm run dev
```

The backend will start at: `http://localhost:5001`

#### 2.7 Verify the server is running

```bash
curl http://localhost:5001/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "SafeBuild API is running",
  "timestamp": "2026-04-12T05:00:00.000Z",
  "environment": "development"
}
```

---

### Step 3 — Frontend Setup

#### 3.1 Open a new terminal and navigate to the frontend directory

```bash
cd frontend
```

#### 3.2 Install dependencies

```bash
npm install
```

#### 3.3 Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set:

```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_MAPBOX_TOKEN=pk.eyJ1...your_mapbox_public_token...
```

> Get a free Mapbox token at [account.mapbox.com](https://account.mapbox.com/)

#### 3.4 Start the frontend dev server

```bash
npm run dev
```

The frontend will start at: `http://localhost:5173`

---

### Step 4 — First Login

Open `http://localhost:5173` in your browser.

Register your first user via the UI, or use cURL:

```bash
curl -X POST http://localhost:5001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Manager",
    "email": "manager@safebuild.com",
    "password": "password123",
    "role": "manager",
    "employeeId": "EMP001"
  }'
```

---
## 🚢 Deployment Report

> For full step-by-step deployment instructions, see [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)

### Deployment Screenshots

![Screenshot 1](./frontend/public/images/Screenshot%201.png)
![Screenshot 2](./frontend/public/images/Screenshot%202.png)
![Screenshot 3](./frontend/public/images/Screenshot%203.png)

### Backend — Railway

**Platform**: [Railway](https://railway.app)  
**Runtime**: Node.js (detected automatically via nixpacks)  
**Entry Point**: `node server.js`

#### Setup Steps

1. Push the repository to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Select the `SafeBuild` repository
4. In **Settings → Source**, set **Root Directory** to `backend`
5. Railway detects Node.js automatically and runs `npm start`
6. Configure all environment variables in the **Variables** tab (see table below)
7. Railway assigns a public URL (e.g., `https://safebuild-production.up.railway.app`)

**Deploy configuration file**: `backend/railway.json`

```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

### Frontend — Vercel

**Platform**: [Vercel](https://vercel.com)  
**Framework**: Vite (React)  
**Build Command**: `npm run build`  
**Output Directory**: `dist`

#### Setup Steps

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `SafeBuild` repo
2. Set **Root Directory** to `frontend`
3. Set **Framework Preset** to `Vite`
4. Configure environment variables in the **Environment Variables** section
5. Click **Deploy**
6. Vercel assigns a public URL (e.g., `https://safebuild.vercel.app`)

**Deploy configuration file**: `frontend/vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> The rewrite rule is essential for React Router to work correctly on page refresh.

---

### Environment Variables

#### Backend (Railway Variables)

| Variable | Description | Secret? |
|---|---|---|
| `PORT` | Server port (Railway may override this) | No |
| `NODE_ENV` | Set to `production` | No |
| `MONGODB_URI` | MongoDB Atlas connection string | **Yes** |
| `JWT_SECRET` | Secret key for signing JWTs (min 32 chars) | **Yes** |
| `JWT_EXPIRE` | JWT expiry duration (e.g. `7d`) | No |
| `OPENROUTER_API_KEY` | OpenRouter API key for SafeBot | **Yes** |
| `HUGGINGFACE_API_KEY` | Hugging Face API key for translation | **Yes** |
| `FRONTEND_URL` | Your Vercel frontend URL (for CORS) | No |

#### Frontend (Vercel Environment Variables)

| Variable | Description | Secret? |
|---|---|---|
| `VITE_API_BASE_URL` | Full URL of Railway backend with `/api` suffix | No |
| `VITE_MAPBOX_TOKEN` | Mapbox public access token | No |

> ⚠️ **Never commit actual secrets to Git.** Only `.env.example` files with placeholder values are committed.

---

### Live URLs

| Service | URL |
|---|---|
| 🔵 **Backend API (Railway)** | `https://safebuild-production.up.railway.app/api` |
| 🟢 **Frontend Application (Vercel)** | `https://safebuild.vercel.app` |
| ❤️ **Health Check** | `https://safebuild-production.up.railway.app/api/health` |

> **Note**: Update the above URLs once deployment is completed. Replace with your actual Railway and Vercel URLs.

---

### Post-Deployment Checklist

- [ ] `GET /api/health` returns `200 OK`
- [ ] Frontend loads without CORS errors
- [ ] Login/Register works
- [ ] MongoDB Atlas Network Access allows Railway's IPs (`0.0.0.0/0` or Railway static IP)
- [ ] `FRONTEND_URL` in Railway matches the exact Vercel deployment URL

---

## 📚 API Endpoint Documentation

### Base URLs

| Environment | URL |
|---|---|
| Local development | `http://localhost:5001/api` |
| Production (Railway) | `https://safebuild-production.up.railway.app/api` |

### Authentication

Most endpoints require a JWT token. Obtain a token by calling the login endpoint, then include it in the `Authorization` header of all subsequent requests:

```
Authorization: Bearer <your_jwt_token>
```

### Role Permissions Summary

| Role | Permissions |
|---|---|
| `worker` | View published courses, report incidents, take quizzes, view own certificates |
| `trainer` | All of worker + create/manage courses, lessons, quizzes |
| `officer` | All of worker + conduct audits, manage corrective actions, update incident status |
| `manager` | Full access to all resources + analytics dashboard, user management |

---

### 🔴 System

#### `GET /api/health`
**Access**: Public  
Check server status.

**Response** `200 OK`
```json
{
  "success": true,
  "message": "SafeBuild API is running",
  "timestamp": "2026-04-12T05:00:00.000Z",
  "environment": "production"
}
```

---

### 🔐 Component 1: User Management & Authentication

#### `POST /api/users/register`
**Access**: Public  
Register a new user account.

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

**Role options**: `worker` | `trainer` | `officer` | `manager`

**Response** `201 Created`:
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
      "employeeId": "EMP001"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### `POST /api/users/login`
**Access**: Public  
Authenticate and receive a JWT token.

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Response** `200 OK`:
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
      "role": "worker"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### `GET /api/users/profile`
**Access**: Private — All authenticated users  
Get the current user's profile.

**Response** `200 OK`:
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

---

#### `PUT /api/users/profile`
**Access**: Private — All authenticated users  
Update the current user's profile.

**Request Body** (all fields optional):
```json
{
  "firstName": "Johnny",
  "phone": "+94779999999",
  "department": "Electrical"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```

---

#### `GET /api/users`
**Access**: Private — Manager, Officer, Trainer  
Get all users in the system.

**Response** `200 OK`:
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

#### `GET /api/users/:id`
**Access**: Private — Manager, Officer, Trainer  
Get a specific user by ID.

**Response** `200 OK`: Single user object.

---

### 📖 Component 1: Course Management

#### `POST /api/courses`
**Access**: Private — Trainer only  
Create a new training course.

**Request Body**:
```json
{
  "title": "Construction Site Safety Fundamentals",
  "category": "Safety Training",
  "description": "Comprehensive course covering basic safety protocols",
  "level": "Beginner",
  "duration": 120,
  "status": "Draft"
}
```

**Level options**: `Beginner` | `Intermediate` | `Advanced`  
**Status options**: `Draft` | `Published` | `Archived`

**Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "_id": "65f2a3b4c5d6e7f8g9h0i1j2",
    "title": "Construction Site Safety Fundamentals",
    "category": "Safety Training",
    "level": "Beginner",
    "duration": 120,
    "status": "Draft",
    "createdBy": "65f1a2b3c4d5e6f7g8h9i0j1",
    "createdAt": "2026-04-12T10:00:00.000Z"
  }
}
```

---

#### `GET /api/courses`
**Access**: Private — All authenticated users  
Get all courses. Workers see only Published courses. Trainers see only their own courses.

**Query Parameters**:
| Parameter | Type | Description |
|---|---|---|
| `category` | string | Filter by category |
| `level` | string | Filter by level |
| `status` | string | Filter by status (non-workers only) |
| `search` | string | Search title and description |

**Example**: `GET /api/courses?status=Published&level=Beginner`

**Response** `200 OK`:
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "65f2a3b4c5d6e7f8g9h0i1j2",
      "title": "Construction Site Safety Fundamentals",
      "category": "Safety Training",
      "level": "Beginner",
      "duration": 120,
      "status": "Published",
      "createdBy": { "name": "Jane Trainer", "email": "jane@safebuild.com" }
    }
  ]
}
```

---

#### `GET /api/courses/:id`
**Access**: Private — All authenticated users  
Get a single course with its lessons.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "course": { "_id": "...", "title": "...", "status": "Published" },
    "lessons": [
      { "_id": "...", "title": "Intro to Safety", "orderIndex": 1 }
    ]
  }
}
```

---

#### `GET /api/courses/:id/stats`
**Access**: Private — Trainer only  
Get enrollment and quiz statistics for a course.

---

#### `PUT /api/courses/:id`
**Access**: Private — Trainer (must own the course)  
Update course details.

**Request Body** (partial update supported):
```json
{
  "title": "Advanced Construction Site Safety",
  "status": "Published"
}
```

---

#### `DELETE /api/courses/:id`
**Access**: Private — Trainer (must own the course)  
Delete a course and all associated lessons and enrollments.

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

---

### 📄 Component 1: Lesson Management

#### `POST /api/lessons`
**Access**: Private — Trainer only  
Create a lesson for a course.

**Request Body**:
```json
{
  "courseId": "65f2a3b4c5d6e7f8g9h0i1j2",
  "title": "Introduction to PPE",
  "orderIndex": 1,
  "pages": [
    { "title": "What is PPE?", "content": "<p>Personal Protective Equipment...</p>" }
  ]
}
```

---

#### `GET /api/lessons/course/:courseId`
**Access**: Private — All authenticated users  
Get all lessons for a specific course.

---

#### `GET /api/lessons/:id`
**Access**: Private — All authenticated users  
Get a single lesson with its pages.

---

#### `PUT /api/lessons/:id`
**Access**: Private — Trainer only  
Update a lesson.

---

#### `DELETE /api/lessons/:id`
**Access**: Private — Trainer only  
Delete a lesson.

---

#### `POST /api/lessons/:id/pages`
**Access**: Private — Trainer only  
Add a page to a lesson.

**Request Body**:
```json
{
  "title": "PPE Types",
  "content": "<p>There are several types of PPE...</p>"
}
```

---

#### `PUT /api/lessons/:id/pages/:pageId`
**Access**: Private — Trainer only  
Update a specific page within a lesson.

---

#### `DELETE /api/lessons/:id/pages/:pageId`
**Access**: Private — Trainer only  
Delete a specific page from a lesson.

---

### 📋 Component 1: Enrollment & Progress Tracking

#### `POST /api/enrollments`
**Access**: Private — All authenticated users  
Enroll in a course.

**Request Body**:
```json
{
  "courseId": "65f2a3b4c5d6e7f8g9h0i1j2"
}
```

---

#### `GET /api/enrollments/my-courses`
**Access**: Private — All authenticated users  
Get all of the current user's enrolled courses.

---

#### `GET /api/enrollments/course/:courseId`
**Access**: Private — All authenticated users  
Get enrollment status for a specific course.

---

#### `GET /api/enrollments/status/:status`
**Access**: Private — All authenticated users  
Get enrollments filtered by status (`in-progress`, `completed`).

---

#### `GET /api/enrollments/:enrollmentId/continue`
**Access**: Private — All authenticated users  
Get the next lesson/page to continue learning.

---

#### `POST /api/enrollments/progress`
**Access**: Private — All authenticated users  
Update lesson completion progress.

**Request Body**:
```json
{
  "courseId": "65f2a3b4c5d6e7f8g9h0i1j2",
  "lessonId": "65f3a4b5c6d7e8f9g0h1i2j3",
  "pageId": "65f5a6b7c8d9e0f1g2h3i4j5"
}
```

---

### 🎯 Component 2: Quiz & Assessment

#### `POST /api/quizzes`
**Access**: Private — Trainer only  
Create a quiz for a course.

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
      "options": ["Call for help", "Use extinguisher", "Evacuate immediately", "Take photos"],
      "correctAnswer": "Evacuate immediately",
      "points": 10
    }
  ]
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "message": "Quiz created successfully",
  "data": {
    "_id": "65f4a5b6c7d8e9f0g1h2i3j4",
    "title": "Safety Fundamentals Assessment",
    "passingScore": 70,
    "timeLimit": 30,
    "questions": [ ... ],
    "createdAt": "2026-04-12T12:00:00.000Z"
  }
}
```

---

#### `GET /api/quizzes`
**Access**: Private — All authenticated users  
Get all quizzes. Accepts `?courseId=` query parameter.

---

#### `GET /api/quizzes/:id`
**Access**: Private — All authenticated users  
Get a specific quiz with all questions.

---

#### `PUT /api/quizzes/:id`
**Access**: Private — Trainer only  
Update quiz details.

---

#### `DELETE /api/quizzes/:id`
**Access**: Private — Trainer only  
Delete a quiz.

---

#### `POST /api/quizzes/:id/questions`
**Access**: Private — Trainer only  
Add a question to an existing quiz.

---

#### `PUT /api/quizzes/:id/questions/:questionId`
**Access**: Private — Trainer only  
Update a specific question.

---

#### `DELETE /api/quizzes/:id/questions/:questionId`
**Access**: Private — Trainer only  
Delete a specific question.

---

#### `POST /api/quiz-attempts`
**Access**: Private — All authenticated users  
Submit a quiz attempt and receive graded results.

**Request Body**:
```json
{
  "quizId": "65f4a5b6c7d8e9f0g1h2i3j4",
  "answers": [
    { "questionId": "65f5a6b7...", "selectedAnswer": "Evacuate immediately" }
  ],
  "timeTaken": 18
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "data": {
    "score": 90,
    "passed": true,
    "passingScore": 70,
    "correctAnswers": 9,
    "totalQuestions": 10,
    "certificateIssued": true
  }
}
```

---

#### `GET /api/quiz-attempts/my-attempts`
**Access**: Private — All authenticated users  
Get the current user's quiz attempt history.

---

#### `GET /api/quiz-attempts`
**Access**: Private — Trainer, Manager, Officer  
Get all quiz attempts across all users.

---

#### `GET /api/quiz-attempts/quiz/:quizId/stats`
**Access**: Private — Trainer, Manager, Officer  
Get statistics (pass rate, avg score) for a specific quiz.

---

#### `GET /api/quiz-attempts/:id`
**Access**: Private — Owner or Admin roles  
Get details of a specific quiz attempt.

---

### 🎓 Component 2: Certificates

#### `GET /api/certificates/verify/:code`
**Access**: Public  
Verify a certificate by its unique code — no authentication required (used for QR code scanning).

**Example**: `GET /api/certificates/verify/CERT-2026-ABC123`

**Response** `200 OK`:
```json
{
  "success": true,
  "valid": true,
  "data": {
    "certificateCode": "CERT-2026-ABC123",
    "userName": "John Doe",
    "courseName": "Construction Site Safety Fundamentals",
    "issueDate": "2026-04-12T15:00:00.000Z",
    "expiryDate": "2027-04-12T15:00:00.000Z",
    "status": "Active"
  }
}
```

---

#### `GET /api/certificates/my-certificates`
**Access**: Private — All authenticated users  
Get all certificates earned by the current user.

**Response** `200 OK`:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "65f6a7b8c9d0e1f2g3h4i5j6",
      "courseId": { "title": "Construction Site Safety Fundamentals" },
      "certificateCode": "CERT-2026-ABC123",
      "issueDate": "2026-04-12T15:00:00.000Z",
      "expiryDate": "2027-04-12T15:00:00.000Z",
      "status": "Active"
    }
  ]
}
```

---

#### `GET /api/certificates`
**Access**: Private — Manager, Officer, Trainer  
Get all certificates in the system.

---

#### `GET /api/certificates/:id`
**Access**: Private — All authenticated users  
Get a specific certificate by ID.

---

#### `PUT /api/certificates/:id/revoke`
**Access**: Private — Manager, Officer, Trainer  
Revoke a certificate.

---

#### `GET /api/certificates/stats/overview`
**Access**: Private — Manager, Officer, Trainer  
Get certificate statistics (total issued, active, expired, etc.).

---

### 🚨 Component 3: Incident & Hazard Reporting

#### `POST /api/incidents`
**Access**: Private — All authenticated users  
Report a new incident or hazard.

**Request Body**:
```json
{
  "title": "Fall from scaffolding",
  "type": "Accident",
  "severity": "High",
  "location": {
    "site": "Main Construction Site",
    "area": "Building A - 3rd Floor",
    "address": "123 Construction Ave, Colombo",
    "latitude": 6.9271,
    "longitude": 79.8612
  },
  "description": "Worker slipped and fell from scaffolding due to wet surface",
  "dateOccurred": "2026-04-12T09:30:00.000Z",
  "assignedTo": "65f7a8b9c0d1e2f3g4h5i6j7"
}
```

**Type options**: `Near Miss` | `Accident` | `Hazard` | `Equipment Failure`  
**Severity options**: `Low` | `Medium` | `High` | `Critical`

**Response** `201 Created`:
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
    "reportedBy": { "firstName": "John", "lastName": "Doe" },
    "createdAt": "2026-04-12T10:00:00.000Z"
  }
}
```

---

#### `GET /api/incidents`
**Access**: Private — All authenticated users  
Get incidents. Workers see only their own; managers/officers see all.

**Query Parameters**:
| Parameter | Type | Description |
|---|---|---|
| `status` | string | `Open` \| `In Progress` \| `Resolved` \| `Closed` |
| `severity` | string | `Low` \| `Medium` \| `High` \| `Critical` |
| `type` | string | `Near Miss` \| `Accident` \| `Hazard` \| `Equipment Failure` |
| `search` | string | Search title, description, location |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |

**Example**: `GET /api/incidents?status=Open&severity=High&page=1&limit=10`

**Response** `200 OK`:
```json
{
  "success": true,
  "count": 10,
  "total": 45,
  "page": 1,
  "pages": 5,
  "data": [ ... ]
}
```

---

#### `GET /api/incidents/stats/summary`
**Access**: Private — Manager, Officer  
Get incident statistics grouped by type, severity, and status.

---

#### `GET /api/incidents/:id`
**Access**: Private — All authenticated users  
Get full details of a specific incident including comments.

---

#### `PUT /api/incidents/:id`
**Access**: Private — Owner or Manager/Officer  
Update incident details (workers can only update their own open incidents).

---

#### `PATCH /api/incidents/:id/status`
**Access**: Private — Manager, Officer  
Update only the incident status.

**Request Body**:
```json
{
  "status": "In Progress"
}
```

---

#### `POST /api/incidents/:id/comments`
**Access**: Private — Manager, Officer  
Add an investigation comment to an incident.

**Request Body**:
```json
{
  "text": "Initial investigation started. Site secured."
}
```

---

#### `DELETE /api/incidents/:id`
**Access**: Private — Owner (open incidents only) or Manager/Officer  
Delete an incident report.

---

### ✅ Component 4: Checklist Templates

#### `POST /api/checklists`
**Access**: Private — Manager only  
Create an audit checklist template.

**Request Body**:
```json
{
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
}
```

---

#### `GET /api/checklists`
**Access**: Private — All authenticated users  
Get all checklist templates.

---

#### `GET /api/checklists/:id`
**Access**: Private — All authenticated users  
Get a specific checklist template.

---

#### `PUT /api/checklists/:id`
**Access**: Private — Manager only  
Update a checklist template.

---

#### `DELETE /api/checklists/:id`
**Access**: Private — Manager only  
Delete a checklist template.

---

### 🔍 Component 4: Compliance Auditing

#### `POST /api/audits`
**Access**: Private — Manager only  
Schedule a new compliance audit.

**Request Body**:
```json
{
  "site": "Main Construction Site - Building A",
  "auditDate": "2026-05-01T09:00:00.000Z",
  "checklistTemplate": "65f9a0b1c2d3e4f5g6h7i8j9",
  "assignedAuditor": "65f7a8b9c0d1e2f3g4h5i6j7"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "message": "Audit scheduled successfully",
  "data": {
    "_id": "65f0a1b2c3d4e5f6g7h8i9j0",
    "site": "Main Construction Site - Building A",
    "auditDate": "2026-05-01T09:00:00.000Z",
    "status": "Scheduled",
    "complianceScore": null,
    "createdAt": "2026-04-12T14:00:00.000Z"
  }
}
```

---

#### `GET /api/audits`
**Access**: Private — All authenticated users  
Get all audits.

**Query Parameters**: `status`, `site`, `assignedAuditor`, `startDate`, `endDate`

---

#### `GET /api/audits/:id`
**Access**: Private — All authenticated users  
Get a specific audit including checklist responses and compliance score.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "status": "Completed",
    "complianceScore": 85,
    "responses": [
      {
        "category": "PPE Compliance",
        "itemResponses": [
          { "item": "Hard hats worn", "status": "Pass", "notes": "All compliant" },
          { "item": "Safety vests", "status": "Fail", "notes": "2 workers missing" }
        ]
      }
    ],
    "findings": "Minor non-compliance issues identified"
  }
}
```

---

#### `PUT /api/audits/:id`
**Access**: Private — Manager, Officer  
Update audit details or submit completed responses.

**Request Body**:
```json
{
  "status": "Completed",
  "responses": [ ... ],
  "complianceScore": 85,
  "findings": "Minor issues found, corrective actions issued"
}
```

---

#### `DELETE /api/audits/:id`
**Access**: Private — Manager only  
Delete an audit.

---

### 🔧 Component 4: Corrective Actions

#### `GET /api/corrective-actions`
**Access**: Private — Manager, Officer  
Get all corrective actions.

**Query Parameters**: `status`, `priority`, `assignedTo`  
**Status options**: `Pending` | `In Progress` | `Completed` | `Overdue`  
**Priority options**: `Low` | `Medium` | `High` | `Critical`

---

#### `GET /api/corrective-actions/stats`
**Access**: Private — Manager only  
Get statistics on corrective actions (overdue, completion rates, etc.).

---

#### `GET /api/corrective-actions/:id`
**Access**: Private — Manager, Officer  
Get a specific corrective action.

---

#### `PUT /api/corrective-actions/:id`
**Access**: Private — Manager, Officer  
Update a corrective action.

**Request Body**:
```json
{
  "status": "Completed",
  "completionNotes": "Safety railings installed and passed inspection.",
  "completedDate": "2026-04-20T16:00:00.000Z"
}
```

---

#### `POST /api/corrective-actions/:id/completion-document`
**Access**: Private — Safety Compliance Manager  
Upload a completion report document (`multipart/form-data`).

**Form field**: `reportFile` — PDF or image file.

---

#### `DELETE /api/corrective-actions/:id`
**Access**: Private — Manager only  
Delete a corrective action.

---

### 📊 Analytics

#### `GET /api/analytics/dashboard`
**Access**: Private — Manager only  
Get the full dashboard analytics (incidents, courses, audits KPIs).

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "incidents": { "total": 45, "open": 12, "resolved": 30 },
    "courses": { "total": 10, "published": 8, "enrollments": 150 },
    "audits": { "total": 20, "avgComplianceScore": 82 },
    "correctiveActions": { "total": 35, "overdue": 5, "completed": 28 }
  }
}
```

---

#### `GET /api/analytics/charts`
**Access**: Private — Manager only  
Get chart-ready analytics data (incident trends, compliance scores over time).

---

### 🤖 AI Safety Chatbot (SafeBot)

#### `POST /api/chat`
**Access**: Public (session-based)  
Send a message to SafeBot (powered by OpenRouter / Llama 3.3 70B).

**Request Body**:
```json
{
  "message": "What PPE is required on a construction site?",
  "sessionId": "session-uuid-here"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "reply": "On a construction site, required PPE typically includes: hard hats, safety vests, steel-toed boots, gloves, and eye protection...",
  "sessionId": "session-uuid-here"
}
```

---

#### `DELETE /api/chat/:sessionId`
**Access**: Public  
Clear a chat session's conversation history.

---

### 🌐 Translation (Sinhala / Tamil)

#### `POST /api/translate`
**Access**: Private — All authenticated users  
Translate text using Hugging Face NLLB-200 model.

**Request Body**:
```json
{
  "text": "Always wear your hard hat on site.",
  "targetLanguage": "si"
}
```

**Target language options**: `si` (Sinhala) | `ta` (Tamil)

**Response** `200 OK`:
```json
{
  "success": true,
  "translatedText": "අඩවියේ සෑමවිටම ඔබේ දෘඪ තොප්පිය පළඳිනු ඇත.",
  "targetLanguage": "si"
}
```

---

### ⚠️ Standard Error Responses

All endpoints return consistent error responses:

| Status | Meaning | Example |
|---|---|---|
| `400` | Validation error / bad request | Missing required field |
| `401` | Unauthorized — no/invalid token | Token expired or missing |
| `403` | Forbidden — insufficient role | Worker accessing manager endpoint |
| `404` | Resource not found | Course ID doesn't exist |
| `500` | Internal server error | Database connection failed |

**Error response format**:
```json
{
  "success": false,
  "message": "Descriptive error message here"
}
```

---


## 🧪 Testing Instructions

### Testing Environment Configuration

The backend requires a separate test environment. Create `backend/.env.test` (optional — MongoDB Memory Server is used in unit tests, so no real DB is needed):

```env
NODE_ENV=test
JWT_SECRET=test_jwt_secret_for_testing_only
```

Jest is configured in `backend/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:integration": "NODE_ENV=test jest tests/integration --runInBand"
  }
}
```

**Key test dependencies**:
- `jest` — Test runner
- `supertest` — HTTP assertion layer for integration tests
- `mongodb-memory-server` — In-memory MongoDB (no Atlas required for tests)

---

### Unit Tests

Unit tests mock all external dependencies (database models, services) and test controller logic in isolation.

**Test files** (`backend/tests/unit/`):
| File | Component Tested |
|---|---|
| `trainingCourseManager.test.js` | Course controller logic, role-based filtering |
| `assessmentCertificationSystem.test.js` | Quiz attempt grading, certificate issuance logic |
| `incidentHazardReporting.test.js` | Incident creation, comment, status change logic |
| `complianceAuditingCorrectiveActions.test.js` | Audit scoring, corrective action workflows |

#### Run All Unit Tests

```bash
cd backend
npm test
```

#### Run Unit Tests with Watch Mode

```bash
npx jest --watch
```

#### Run a Specific Test File

```bash
npx jest tests/unit/trainingCourseManager.test.js
```

#### Run Tests with Verbose Output

```bash
npx jest --verbose
```

#### Run Tests with Coverage Report

```bash
npx jest --coverage
```

Coverage report is output to `backend/coverage/lcov-report/index.html`.

**Example output**:
```
PASS tests/unit/trainingCourseManager.test.js
  Training Course Manager unit tests
    ✓ getAllCourses should force workers to only see Published courses (12ms)
    ✓ getAllCourses should scope trainers to their own courses (8ms)
    ✓ deleteCourse should reject non-owner trainer (6ms)
    ✓ deleteCourse should remove linked lessons and enrollments for owner (9ms)

Test Suites: 4 passed, 4 total
Tests:       16 passed, 16 total
```

---

### Integration Testing

Integration tests use **mongodb-memory-server** to spin up a real (but temporary) MongoDB instance. They test the full HTTP request/response cycle — router → middleware → controller → database — using `supertest`.

**Test file** (`backend/tests/integration/`):
| File | What is Tested |
|---|---|
| `systemFlows.integration.test.js` | Complete user flows: register → login → enroll → quiz → certificate |

#### Setup

No external setup needed. `mongodb-memory-server` downloads and starts MongoDB automatically.

> **Note**: First run may take 30–60 seconds to download the MongoDB binary.

#### Run Integration Tests

```bash
cd backend
npm run test:integration
```

This command:
- Sets `NODE_ENV=test`
- Runs only files in `tests/integration/`
- Uses `--runInBand` to execute tests serially (prevents race conditions on shared DB)

#### Run All Tests (Unit + Integration)

```bash
cd backend
npm test -- --testPathPattern="tests/(unit|integration)"
```

**Example output**:
```
PASS tests/integration/systemFlows.integration.test.js
  System Integration Flows
    ✓ Worker registration → login → course enrollment → quiz submission → certificate (245ms)
    ✓ Manager can view all incidents and update status (180ms)
    ✓ Officer can schedule audit and submit responses (220ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Time:        4.2s
```

---

### Frontend Unit Tests

Frontend tests use **Vitest** with `@testing-library/react`.

#### Run Frontend Tests

```bash
cd frontend
npm test
```

#### Run in Watch Mode

```bash
npm run test:watch
```

---

### Performance Testing

Performance tests use **Artillery** to simulate load on the live backend API.

**Test profile** (`backend/tests/performance/api-load.yml`):

| Phase | Duration | Arrival Rate | Description |
|---|---|---|---|
| Warm-up | 30s | 2 req/s | Stabilize server at low load |
| Moderate Load | 45s | 10 req/s | Normal usage simulation |
| High Concurrency | 30s | 25 req/s | Sustained concurrent traffic |
| Stress Spike | 20s | 40 req/s | Short burst to test limits |

**Pass/Fail Thresholds**:
| Metric | Threshold |
|---|---|
| p95 latency | ≤ 800ms |
| p99 latency | ≤ 1200ms |
| HTTP 500 errors | = 0 |
| Error rate | ≤ 1% |

#### Prerequisites

```bash
cd backend
npm install   # artillery is already in devDependencies
```

#### Run Performance Tests (against local server)

Ensure the backend server is running (`npm run dev`), then in a separate terminal:

```bash
cd backend
npm run test:performance
```

This targets `http://localhost:5001` by default.

#### Run Against a Remote Environment

```bash
PERF_TARGET=https://safebuild-production.up.railway.app npm run test:performance
```

#### Generate HTML Report

```bash
npm run test:performance:report
```

This outputs:
- Raw JSON: `backend/tests/performance/last-report.json`
- HTML report: open with `artillery report backend/tests/performance/last-report.json`

**Test scenarios defined**:
| Scenario | Weight | Flow |
|---|---|---|
| Health Endpoint | 40% | `GET /api/health` |
| Worker Register + Profile | 35% | Register → `GET /api/users/profile` |
| Trainer Register + Course | 25% | Register → Create course → `GET /api/courses` |

**Example output**:
```
Summary report @ 11:00:00
  Scenarios launched:  1250
  Scenarios completed: 1247
  Requests completed:  3741
  Mean response/sec:   18.92
  Response time (msec):
    min: 34
    max: 612
    median: 89
    p95: 342
    p99: 498
  HTTP 200: 3741
  HTTP 500: 0
```

---

## 🔒 Security Features

| Feature | Implementation |
|---|---|
| Password hashing | `bcryptjs` with salt rounds |
| Token authentication | `jsonwebtoken` (JWT) |
| Role-based access control | `authorize()` middleware per route |
| Request validation | `express-validator` on all mutation endpoints |
| CORS protection | Origin whitelist via `FRONTEND_URL` env variable |
| XSS sanitization | `DOMPurify` on frontend rich-text content |

---

## 🐛 Troubleshooting

| Issue | Solution |
|---|---|
| Cannot connect to MongoDB | Check `MONGODB_URI` in `.env`, verify IP whitelist in Atlas |
| `Token expired` error | Log in again to receive a new JWT |
| Port already in use | Change `PORT` in `.env` or kill the process: `lsof -ti:5001 \| xargs kill` |
| Module not found | Run `npm install` in the affected directory |
| CORS error in browser | Ensure `FRONTEND_URL` in backend `.env` matches the frontend origin exactly |
| `401 Unauthorized` | Ensure `Authorization: Bearer <token>` header is present |
| MapPicker not loading | Ensure `VITE_MAPBOX_TOKEN` is set correctly in frontend `.env` |
| Translation fails | Check `HUGGINGFACE_API_KEY` is valid and not rate-limited |
| SafeBot not responding | Check `OPENROUTER_API_KEY` is valid and has credits |

---

## 📊 Database Models Summary

| Model | Key Fields |
|---|---|
| `User` | firstName, lastName, email, password (hashed), role, employeeId, department, isActive |
| `Course` | title, category, description, level, duration, status, createdBy |
| `Lesson` | courseId, title, orderIndex, pages[] |
| `Enrollment` | userId, courseId, completedLessons[], completedPages[], status |
| `Quiz` | courseId, title, questions[], passingScore, timeLimit |
| `QuizAttempt` | quizId, userId, answers[], score, passed, timeTaken |
| `Certificate` | userId, courseId, certificateCode, issueDate, expiryDate, status |
| `Incident` | title, type, severity, status, location, description, reportedBy, assignedTo, comments[] |
| `Checklist` | title, category, items[] |
| `Audit` | site, auditDate, status, checklistTemplate, assignedAuditor, responses[], complianceScore |
| `CorrectiveAction` | title, priority, status, dueDate, assignedTo, audit, relatedIncident |

---

## 👥 Development Team

Year 03 — BSc (Hons) in Information Technology  
Specialized in Software Engineering  
Sri Lanka Institute of Information Technology (SLIIT)

---

## 📄 License

This project is licensed under the ISC License.

---

**Last Updated**: April 2026
