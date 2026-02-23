# Postman Testing Guide - Quiz & Assessment System

Complete guide for testing the Assessment & Certification System APIs.

## 🎯 Overview

The Assessment System includes:
- **Quiz Management** (Trainer only) - Create, update, delete quizzes
- **Question Management** (Trainer only) - Add, update, delete questions
- **Quiz Attempts** (Workers) - Take quizzes and get auto-graded results
- **Statistics** (Admin) - View quiz performance and statistics

---

## 🔐 Prerequisites

1. **Server running**: `npm run dev` (Port 5001)
2. **Postman installed**
3. **Environment setup** with:
   - `base_url`: `http://localhost:5001/api`
   - `token`: (auto-saved after login)

---

## 📁 Collection Structure

Create folders in your SafeBuild API collection:
```
SafeBuild API/
├── User Management/
└── Assessment System/
    ├── Quiz Management/
    ├── Question Management/
    ├── Quiz Attempts/
    └── Statistics/
```

---

## 🎓 Part 1: Quiz Management (Trainer Only)

### 1.1 Create Quiz

**Purpose**: Trainer creates a new quiz

**Request**:
- **Method**: `POST`
- **URL**: `{{base_url}}/quizzes`
- **Authorization**: Bearer Token `{{token}}`

**Headers**:
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "title": "Construction Safety Basics",
  "description": "This quiz tests your knowledge of basic construction safety procedures and regulations.",
  "passMark": 70,
  "timeLimit": 30
}
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Quiz created successfully",
  "data": {
    "_id": "quiz_id_here",
    "title": "Construction Safety Basics",
    "description": "This quiz tests your knowledge...",
    "passMark": 70,
    "timeLimit": 30,
    "questions": [],
    "createdBy": "trainer_id",
    "isActive": true,
    "totalPoints": 0,
    "createdAt": "2026-02-19T...",
    "updatedAt": "2026-02-19T..."
  }
}
```

**Tests Script**:
```javascript
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.environment.set("quiz_id", jsonData.data._id);
    console.log("✅ Quiz created! ID saved:", jsonData.data._id);
}
```

---

### 1.2 Get All Quizzes

**Request**:
- **Method**: `GET`
- **URL**: `{{base_url}}/quizzes`
- **Authorization**: Bearer Token `{{token}}`

**Query Parameters** (optional):
- `isActive`: `true` or `false`

**Example**: `{{base_url}}/quizzes?isActive=true`

**Expected Response** (200 OK):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "...",
      "title": "Construction Safety Basics",
      "description": "...",
      "passMark": 70,
      "questions": [...],
      "createdBy": {
        "_id": "...",
        "firstName": "Mike",
        "lastName": "Trainer",
        "email": "trainer@safebuild.com"
      },
      ...
    }
  ]
}
```

---

### 1.3 Get Quiz by ID

**Request**:
- **Method**: `GET`
- **URL**: `{{base_url}}/quizzes/{{quiz_id}}`
- **Authorization**: Bearer Token `{{token}}`

**Note**: Workers won't see correct answers, only question text and answer options.

---

### 1.4 Update Quiz

**Request**:
- **Method**: `PUT`
- **URL**: `{{base_url}}/quizzes/{{quiz_id}}`
- **Authorization**: Bearer Token `{{token}}` (Trainer only)

**Body** (raw JSON):
```json
{
  "title": "Construction Safety Basics - Updated",
  "passMark": 75,
  "isActive": true
}
```

---

### 1.5 Delete Quiz

**Request**:
- **Method**: `DELETE`
- **URL**: `{{base_url}}/quizzes/{{quiz_id}}`
- **Authorization**: Bearer Token `{{token}}` (Trainer only)

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Quiz deleted successfully"
}
```

---

## ❓ Part 2: Question Management (Trainer Only)

### 2.1 Add Question to Quiz

**Purpose**: Add a multiple-choice question with 4 answers

**Request**:
- **Method**: `POST`
- **URL**: `{{base_url}}/quizzes/{{quiz_id}}/questions`
- **Authorization**: Bearer Token `{{token}}` (Trainer only)

**Body** (raw JSON):
```json
{
  "questionText": "What is the primary purpose of wearing a hard hat on a construction site?",
  "answers": [
    {
      "answerText": "To look professional",
      "isCorrect": false
    },
    {
      "answerText": "To protect from falling objects",
      "isCorrect": true
    },
    {
      "answerText": "To keep warm",
      "isCorrect": false
    },
    {
      "answerText": "To improve visibility",
      "isCorrect": false
    }
  ],
  "points": 1
}
```

**Important Rules**:
- Must have exactly 4 answers
- Exactly one answer must have `"isCorrect": true`
- `points` is optional (default: 1)

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Question added successfully",
  "data": {
    "_id": "quiz_id",
    "title": "Construction Safety Basics",
    "questions": [
      {
        "_id": "question_id",
        "questionText": "What is the primary purpose...",
        "answers": [...],
        "points": 1
      }
    ],
    "totalPoints": 1
  }
}
```

**Tests Script**:
```javascript
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    const questions = jsonData.data.questions;
    if (questions.length > 0) {
        const lastQuestion = questions[questions.length - 1];
        pm.environment.set("question_id", lastQuestion._id);
        console.log("✅ Question added! ID:", lastQuestion._id);
    }
}
```

---

### 2.2 Add Multiple Questions

**Add Question 2**:
```json
{
  "questionText": "What should you do before using a ladder?",
  "answers": [
    {"answerText": "Inspect it for damage", "isCorrect": true},
    {"answerText": "Paint it", "isCorrect": false},
    {"answerText": "Clean it", "isCorrect": false},
    {"answerText": "Register it", "isCorrect": false}
  ],
  "points": 1
}
```

**Add Question 3**:
```json
{
  "questionText": "How many points of contact should you maintain when climbing a ladder?",
  "answers": [
    {"answerText": "One", "isCorrect": false},
    {"answerText": "Two", "isCorrect": false},
    {"answerText": "Three", "isCorrect": true},
    {"answerText": "Four", "isCorrect": false}
  ],
  "points": 1
}
```

**Add Question 4**:
```json
{
  "questionText": "What is the minimum safe distance from the edge of an unprotected floor or roof?",
  "answers": [
    {"answerText": "1 foot", "isCorrect": false},
    {"answerText": "3 feet", "isCorrect": false},
    {"answerText": "6 feet", "isCorrect": true},
    {"answerText": "10 feet", "isCorrect": false}
  ],
  "points": 1
}
```

---

### 2.3 Update Question

**Request**:
- **Method**: `PUT`
- **URL**: `{{base_url}}/quizzes/{{quiz_id}}/questions/{{question_id}}`
- **Authorization**: Bearer Token `{{token}}` (Trainer only)

**Body** (raw JSON):
```json
{
  "questionText": "What is the PRIMARY purpose of wearing a hard hat?",
  "points": 2
}
```

---

### 2.4 Delete Question

**Request**:
- **Method**: `DELETE`
- **URL**: `{{base_url}}/quizzes/{{quiz_id}}/questions/{{question_id}}`
- **Authorization**: Bearer Token `{{token}}` (Trainer only)

---

## 📝 Part 3: Quiz Attempts (Workers)

### 3.1 Submit Quiz Attempt

**Purpose**: Worker takes quiz and system auto-grades it

**Request**:
- **Method**: `POST`
- **URL**: `{{base_url}}/quiz-attempts`
- **Authorization**: Bearer Token `{{token}}`

**Body** (raw JSON):
```json
{
  "quizId": "{{quiz_id}}",
  "startedAt": "2026-02-19T10:00:00.000Z",
  "answers": [
    {"selectedAnswer": 1},
    {"selectedAnswer": 0},
    {"selectedAnswer": 2},
    {"selectedAnswer": 2}
  ]
}
```

**Notes**:
- `selectedAnswer` is the index (0-3) of the chosen answer
- Must submit answers for ALL questions
- `startedAt` is optional (for time tracking)

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Congratulations! You passed the quiz!",
  "data": {
    "_id": "attempt_id",
    "user": {
      "_id": "...",
      "firstName": "Bob",
      "lastName": "Builder",
      "email": "bob@safebuild.com"
    },
    "quiz": {
      "_id": "quiz_id",
      "title": "Construction Safety Basics",
      "description": "...",
      "passMark": 70
    },
    "answers": [
      {
        "questionId": "q1_id",
        "selectedAnswer": 1,
        "isCorrect": true,
        "pointsEarned": 1
      },
      {
        "questionId": "q2_id",
        "selectedAnswer": 0,
        "isCorrect": true,
        "pointsEarned": 1
      },
      {
        "questionId": "q3_id",
        "selectedAnswer": 2,
        "isCorrect": true,
        "pointsEarned": 1
      },
      {
        "questionId": "q4_id",
        "selectedAnswer": 2,
        "isCorrect": true,
        "pointsEarned": 1
      }
    ],
    "score": 4,
    "percentage": 100,
    "passed": true,
    "startedAt": "2026-02-19T10:00:00.000Z",
    "submittedAt": "2026-02-19T10:15:23.456Z",
    "timeTaken": 923
  }
}
```

**Failed Attempt Example**:
```json
{
  "quizId": "{{quiz_id}}",
  "startedAt": "2026-02-19T11:00:00.000Z",
  "answers": [
    {"selectedAnswer": 0},
    {"selectedAnswer": 1},
    {"selectedAnswer": 0},
    {"selectedAnswer": 1}
  ]
}
```

Response will show `"passed": false` if score < passMark.

---

### 3.2 Get My Attempts

**Purpose**: View your own quiz attempt history

**Request**:
- **Method**: `GET`
- **URL**: `{{base_url}}/quiz-attempts/my-attempts`
- **Authorization**: Bearer Token `{{token}}`

**Query Parameters** (optional):
- `quizId`: Filter by specific quiz

**Example**: `{{base_url}}/quiz-attempts/my-attempts?quizId={{quiz_id}}`

**Expected Response** (200 OK):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "attempt_id_2",
      "quiz": {
        "title": "Construction Safety Basics",
        "passMark": 70,
        "totalPoints": 4
      },
      "score": 4,
      "percentage": 100,
      "passed": true,
      "submittedAt": "2026-02-19T11:30:00.000Z",
      ...
    },
    {
      "_id": "attempt_id_1",
      "quiz": {...},
      "score": 2,
      "percentage": 50,
      "passed": false,
      "submittedAt": "2026-02-19T10:15:00.000Z",
      ...
    }
  ]
}
```

---

### 3.3 Get Attempt by ID

**Request**:
- **Method**: `GET`
- **URL**: `{{base_url}}/quiz-attempts/{{attempt_id}}`
- **Authorization**: Bearer Token `{{token}}`

**Notes**:
- Workers can only view their own attempts
- Admin (Trainer/Manager/Officer) can view any attempt

---

## 📊 Part 4: Statistics & Admin (Trainer/Manager/Officer Only)

### 4.1 Get All Attempts

**Purpose**: View all quiz attempts across all users

**Request**:
- **Method**: `GET`
- **URL**: `{{base_url}}/quiz-attempts`
- **Authorization**: Bearer Token `{{token}}` (Admin only)

**Query Parameters** (optional):
- `quizId`: Filter by quiz
- `userId`: Filter by user
- `passed`: Filter by pass/fail (`true`/`false`)

**Examples**:
```
{{base_url}}/quiz-attempts?quizId={{quiz_id}}
{{base_url}}/quiz-attempts?passed=true
{{base_url}}/quiz-attempts?userId=USER_ID&quizId={{quiz_id}}
```

---

### 4.2 Get Quiz Statistics

**Purpose**: Get analytics for a specific quiz

**Request**:
- **Method**: `GET`
- **URL**: `{{base_url}}/quiz-attempts/quiz/{{quiz_id}}/stats`
- **Authorization**: Bearer Token `{{token}}` (Admin only)

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalAttempts": 15,
    "passedAttempts": 10,
    "failedAttempts": 5,
    "passRate": 67,
    "averageScore": 72,
    "highestScore": 100,
    "lowestScore": 25
  }
}
```

---

## 🧪 Complete Testing Workflow

### Step 1: Login as Trainer
```json
POST {{base_url}}/users/login
{
  "email": "trainer@safebuild.com",
  "password": "trainer123"
}
```
✅ Token auto-saved

### Step 2: Create Quiz
```json
POST {{base_url}}/quizzes
{
  "title": "Construction Safety Basics",
  "description": "Basic safety knowledge test",
  "passMark": 70,
  "timeLimit": 30
}
```
✅ Quiz ID saved as `{{quiz_id}}`

### Step 3: Add 4 Questions
Use the question examples from section 2.1-2.2

### Step 4: Verify Quiz
```
GET {{base_url}}/quizzes/{{quiz_id}}
```

### Step 5: Login as Worker
```json
POST {{base_url}}/users/login
{
  "email": "bob@safebuild.com",
  "password": "builder123"
}
```

### Step 6: View Available Quizzes
```
GET {{base_url}}/quizzes
```

### Step 7: Take Quiz (Worker)
```json
POST {{base_url}}/quiz-attempts
{
  "quizId": "{{quiz_id}}",
  "startedAt": "2026-02-19T10:00:00.000Z",
  "answers": [
    {"selectedAnswer": 1},
    {"selectedAnswer": 0},
    {"selectedAnswer": 2},
    {"selectedAnswer": 2}
  ]
}
```

### Step 8: View My Attempts
```
GET {{base_url}}/quiz-attempts/my-attempts
```

### Step 9: Login as Trainer (to view stats)
Login as trainer again

### Step 10: View Quiz Statistics
```
GET {{base_url}}/quiz-attempts/quiz/{{quiz_id}}/stats
```

---

## ⚠️ Error Scenarios to Test

### 1. Validation Errors

**Missing Required Fields**:
```json
POST {{base_url}}/quizzes
{
  "title": "Test Quiz"
}
```
Expected: 400 with validation errors

**Wrong Number of Answers**:
```json
POST {{base_url}}/quizzes/{{quiz_id}}/questions
{
  "questionText": "Test?",
  "answers": [
    {"answerText": "A", "isCorrect": true},
    {"answerText": "B", "isCorrect": false}
  ]
}
```
Expected: 400 - "Must have exactly 4 answers"

**Multiple Correct Answers**:
```json
{
  "questionText": "Test?",
  "answers": [
    {"answerText": "A", "isCorrect": true},
    {"answerText": "B", "isCorrect": true},
    {"answerText": "C", "isCorrect": false},
    {"answerText": "D", "isCorrect": false}
  ]
}
```
Expected: 400 - "Must have exactly one correct answer"

### 2. Authorization Errors

**Worker Trying to Create Quiz**:
- Login as worker
- Try: `POST {{base_url}}/quizzes`
- Expected: 403 Forbidden

**Accessing Other User's Attempts**:
- Login as worker 1
- Try to access worker 2's attempt
- Expected: 403 Forbidden

### 3. Not Found Errors

**Invalid Quiz ID**:
```
GET {{base_url}}/quizzes/invalid_id_123
```
Expected: 404 Not Found

---

## 📋 Quick Reference

### Quiz Endpoints

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/quizzes` | Trainer | Create quiz |
| GET | `/quizzes` | All | List quizzes |
| GET | `/quizzes/:id` | All | Quiz details |
| PUT | `/quizzes/:id` | Trainer | Update quiz |
| DELETE | `/quizzes/:id` | Trainer | Delete quiz |

### Question Endpoints

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/quizzes/:id/questions` | Trainer | Add question |
| PUT | `/quizzes/:id/questions/:qId` | Trainer | Update question |
| DELETE | `/quizzes/:id/questions/:qId` | Trainer | Delete question |

### Attempt Endpoints

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/quiz-attempts` | All | Submit attempt |
| GET | `/quiz-attempts/my-attempts` | All | My attempts |
| GET | `/quiz-attempts/:id` | Owner/Admin | Attempt details |
| GET | `/quiz-attempts` | Admin | All attempts |
| GET | `/quiz-attempts/quiz/:id/stats` | Admin | Quiz stats |

---

## ✅ Testing Checklist

- [ ] Trainer can create quiz
- [ ] Trainer can add 4 questions with correct validation
- [ ] Worker can view quizzes (without seeing correct answers)
- [ ] Worker cannot create/edit quizzes
- [ ] Worker can submit quiz attempt
- [ ] Auto-grading calculates score correctly
- [ ] Pass/fail determined by passMark
- [ ] Worker can view own attempts
- [ ] Worker cannot view other workers' attempts
- [ ] Trainer can view all attempts
- [ ] Trainer can view quiz statistics
- [ ] Validation rejects <4 or >4 answers
- [ ] Validation requires exactly 1 correct answer
- [ ] Time tracking works correctly

---

Happy Testing! 🎉
