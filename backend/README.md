# SafeBuild Backend API

RESTful API for SafeBuild - Occupational Safety Training, Certification & Reporting System

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the MongoDB connection string with your actual password:
   
```env
MONGODB_URI=mongodb+srv://shiranthadw_db_user:<db_password>@y3s2.fsvshcc.mongodb.net/safebuild?retryWrites=true&w=majority
```

Replace `<db_password>` with your actual MongoDB password.

4. Start the development server:
```bash
npm run dev
```

Or for production:
```bash
npm start
```

## 📦 Project Structure

```
backend/
├── config/
│   └── db.js                    # Database configuration
├── controllers/
│   ├── userController.js        # User management logic
│   ├── courseController.js      # Course CRUD operations
│   ├── lessonController.js      # Lesson & page management
│   └── enrollmentController.js  # Enrollment & progress tracking
├── models/
│   ├── User.js                  # User schema
│   ├── Course.js                # Course schema
│   ├── Lesson.js                # Lesson & pages schema
│   ├── Enrollment.js            # Enrollment schema
│   └── Progress.js              # Progress tracking schema
├── routes/
│   ├── userRoutes.js            # User endpoints
│   ├── courseRoutes.js          # Course endpoints
│   ├── lessonRoutes.js          # Lesson endpoints
│   └── enrollmentRoutes.js      # Enrollment endpoints
├── middleware/
│   ├── auth.js                  # JWT authentication
│   └── validator.js             # Input validation
├── utils/
│   └── jwt.js                   # JWT helper functions
├── .env                         # Environment variables (not committed)
├── .env.example                 # Example environment variables
├── server.js                    # Application entry point
├── seed.js                      # Database seeding script
├── package.json                 # Dependencies and scripts
├── README.md                    # This file
├── API_TESTING.md               # API testing documentation
├── POSTMAN_GUIDE.md             # Postman testing guide
└── TRAINING_COURSE_API_GUIDE.md # Comprehensive training API guide
```

## 🎯 System Components

### Component 1: Training Course Manager + User Management ✅ IMPLEMENTED
- **User Management**
  - User registration and authentication (JWT-based)
  - Role-based access control (Trainer/Worker)
  - User profile management
  
- **Course Management** (Trainer Only)
  - Create, edit, delete training courses
  - Course details: Title, Category, Description, Level, Duration, Status
  - Categories: PPE, Electrical Safety, Working at Heights, Fire Safety, First Aid, Hazardous Materials, Machine Safety, Confined Spaces, Other
  - Levels: Beginner, Intermediate, Advanced
  - Status: Draft (trainer only) / Published (visible to workers)
  - Filter courses by category, level, and status
  - Track number of enrolled workers per course
  - Course statistics and analytics
  
- **Lesson Management** (Trainer Only)
  - Add, edit, delete lessons under courses
  - Multiple pages per lesson support
  - Page types: Text content (rich text editor), Video links (YouTube integration), Mixed content
  - Lesson ordering and duration tracking
  - Upload learning resources and video links
  
- **Worker Enrollment & Learning**
  - View available published courses
  - Enroll in courses
  - Auto-save lesson progress
  - "Continue Learning" feature (resume from last accessed lesson)
  - Progress bar showing % completed
  - Course status tracking: Not Started, Learning, Finished
  - View enrolled courses by status

### Component 2: Assessment & Certification System
- Quiz/assessment creation
- Certificate generation
- Assessment tracking

### Component 3: Incident & Hazard Reporting
- Incident reporting
- Hazard identification
- Report management

### Component 4: Compliance Auditing & Corrective Actions
- Safety audits
- Compliance tracking
- Corrective action plans

## 🔧 Available Scripts

- `npm start` - Run the server in production mode
- `npm run dev` - Run the server in development mode with nodemon
- `npm test` - Run tests (to be implemented)

## 🌐 API Endpoints

### Health Check
- `GET /api/health` - Check API status

### User Management ✅ IMPLEMENTED
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - Get all users (admin)

### Courses ✅ IMPLEMENTED
- `GET /api/courses` - Get all courses (with filters: category, level, status, search)
- `POST /api/courses` - Create new course (Trainer only)
- `GET /api/courses/:id` - Get course by ID with lessons
- `PUT /api/courses/:id` - Update course (Trainer only)
- `DELETE /api/courses/:id` - Delete course (Trainer only)
- `GET /api/courses/:id/stats` - Get course statistics (Trainer only)

### Lessons ✅ IMPLEMENTED
- `POST /api/lessons` - Create lesson (Trainer only)
- `GET /api/lessons/course/:courseId` - Get all lessons for a course
- `GET /api/lessons/:id` - Get lesson by ID
- `PUT /api/lessons/:id` - Update lesson (Trainer only)
- `DELETE /api/lessons/:id` - Delete lesson (Trainer only)
- `POST /api/lessons/:id/pages` - Add page to lesson (Trainer only)
- `PUT /api/lessons/:id/pages/:pageId` - Update page (Trainer only)
- `DELETE /api/lessons/:id/pages/:pageId` - Delete page (Trainer only)

### Enrollments & Progress ✅ IMPLEMENTED
- `POST /api/enrollments` - Enroll in course (Worker only)
- `GET /api/enrollments/my-courses` - Get my enrollments (Worker only)
- `GET /api/enrollments/course/:courseId` - Get enrollment details for a course (Worker only)
- `GET /api/enrollments/status/:status` - Get courses by status (Worker only)
- `GET /api/enrollments/:enrollmentId/continue` - Continue learning (Worker only)
- `POST /api/enrollments/progress` - Update lesson progress (Worker only)

### Assessments (To be implemented)
- `GET /api/assessments` - Get all assessments
- `POST /api/assessments` - Create assessment
- `POST /api/assessments/:id/submit` - Submit assessment

### Incidents (To be implemented)
- `GET /api/incidents` - Get all incidents
- `POST /api/incidents` - Report incident
- `PUT /api/incidents/:id` - Update incident

### Audits (To be implemented)
- `GET /api/audits` - Get all audits
- `POST /api/audits` - Create audit
- `PUT /api/audits/:id` - Update audit

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development/production |
| MONGODB_URI | MongoDB connection string | mongodb+srv://... |
| JWT_SECRET | Secret key for JWT | your_secret_key |
| JWT_EXPIRE | JWT expiration time | 7d |

## 📝 Notes

- Make sure to replace `<db_password>` in the MongoDB URI with your actual password
- Never commit the `.env` file to version control
- Use `.env.example` as a template for required environment variables

## 📖 Testing Documentation

For comprehensive API testing guides:
- **[Postman Guide](./POSTMAN_GUIDE.md)** - General API testing setup
- **[Training Course Management API Guide](./TRAINING_COURSE_API_GUIDE.md)** - Complete guide for Course Management, Lesson Management, and Worker Enrollment features with:
  - Detailed endpoint documentation
  - Request/response examples
  - Complete testing workflows
  - Edge case testing scenarios
  - Authorization and validation tests
  - Troubleshooting guide

## 📚 Technology Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: bcryptjs for password hashing
