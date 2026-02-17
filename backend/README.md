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
├── config/          # Configuration files (database, etc.)
├── controllers/     # Route controllers
├── models/          # Mongoose models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── .env             # Environment variables (not committed)
├── .env.example     # Example environment variables
├── server.js        # Application entry point
└── package.json     # Dependencies and scripts
```

## 🎯 System Components

### Component 1: Training Course Manager + User Management
- User registration and authentication
- Course creation and management
- User enrollment in courses

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

### User Management (To be implemented)
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

### Courses (To be implemented)
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create new course
- `GET /api/courses/:id` - Get course by ID
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

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

## 📚 Technology Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: bcryptjs for password hashing
