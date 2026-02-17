# SafeBuild 🏗️

**Occupational Safety Training, Certification & Reporting Web App**

A comprehensive web application designed to improve workplace safety in the construction industry by providing digital training, certification, hazard reporting, and compliance monitoring tools.

## 🎯 SDG Goal
**Decent Work and Economic Growth** - Promoting safe and secure working environments for all workers.

## 🏷️ Project Overview

### Domain
Construction Company

### System
Occupational Safety Training, Certification & Reporting Web App

### Purpose
The system aims to improve workplace safety by providing digital training, certification, hazard reporting, and compliance monitoring tools.

### Target Users
- 👷 Construction Workers
- 👨‍💼 Site Managers
- 🛡️ Safety Officers
- 👨‍🏫 Trainers

## 📦 System Components

### ✅ Component 1: Training Course Manager + User Management
- User registration and authentication
- Role-based access control (Workers, Managers, Officers, Trainers)
- Course creation and management
- User enrollment tracking

### ✅ Component 2: Assessment & Certification System
- Digital assessments and quizzes
- Automated grading
- Digital certificate generation
- Certification tracking and expiry management

### ✅ Component 3: Incident & Hazard Reporting
- Real-time incident reporting
- Hazard identification and documentation
- Photo/evidence upload
- Report status tracking

### ✅ Component 4: Compliance Auditing & Corrective Actions
- Safety audit scheduling and execution
- Compliance score tracking
- Corrective action planning
- Follow-up management

## 🛠️ Technology Stack

### Backend
- **Framework**: Express.js (Node.js)
- **Database**: MongoDB Atlas
- **ODM**: Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: bcryptjs

### Frontend
- To be determined

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Copy `.env.example` to `.env` and update with your MongoDB credentials:
   ```bash
   cp .env.example .env
   ```
   
   Update the `MONGODB_URI` in `.env`:
   ```env
   MONGODB_URI=mongodb+srv://shiranthadw_db_user:<your_password>@y3s2.fsvshcc.mongodb.net/safebuild?retryWrites=true&w=majority
   ```
   
   Replace `<your_password>` with your actual MongoDB Atlas password.

4. **Start the development server:**
   ```bash
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

## 📄 License

This project is developed as part of an academic assignment.

## 🔄 Development Progress

- [x] Project initialization
- [x] MongoDB database setup
- [x] Backend server configuration
- [x] Project structure created
- [ ] User authentication system
- [ ] Training course management APIs
- [ ] Assessment system APIs
- [ ] Incident reporting APIs
- [ ] Compliance auditing APIs
- [ ] Frontend development
- [ ] API documentation (Postman)

## 📞 Support

For any queries or issues, please contact the development team.
