# SafeBuild - Team Setup Instructions

Welcome to the SafeBuild development team! Follow these instructions to set up your development environment.

## 🚀 Getting Started

### Step 1: Accept Repository Invitation
1. Check your email for the GitHub repository invitation
2. Click the invitation link and accept it
3. You should now have access to the SafeBuild repository

### step 1.1: create Folder "Y3S2-projects" in your PC.
### step 1.2: This folder Open in VS code , open VS code Terminal Follow below steps ...

### Step 2: Clone the Repository
```bash
git clone https://github.com/Y3S2-WE/SafeBuild.git
cd SafeBuild
```

### Step 3: Checkout the Dev Branch
```bash
git checkout dev
```

### Step 4: Pull Latest Changes
```bash
git pull origin dev
```

### Step 5: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 6: Configure Environment Variables
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and update with your credentials:
   ```env
   PORT=5001
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://shiranthadw_db_user:<YOUR_PASSWORD>@y3s2.fsvshcc.mongodb.net/safebuild?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret_key_change_in_production
   JWT_EXPIRE=7d
   ```

   **Important**: Replace `<YOUR_PASSWORD>` with the actual MongoDB password (get this from team lead)

### Step 7: Start the Development Server
```bash
npm run dev
```

The server should start on `http://localhost:5001`

**Note:** 3 permanent user accounts are already created in the database for testing:
- Manager: `manager@safebuild.com` / `manager123`
- Officer: `officer@safebuild.com` / `officer123`
- Trainer: `trainer@safebuild.com` / `trainer123`

### Step 8: Test the API
Open your browser or Postman and visit:
```
http://localhost:5001/api/health
```

You should see a success response! ✅

---

## 🌿 Creating Your Feature Branch

### When Starting a New Feature/Component:

1. **Make sure you're on dev and it's up to date:**
```bash
   git checkout dev
   git pull origin dev
   ```

2. **Create your feature branch:**
```bash
   git checkout -b feature/your-feature-name
   ```
**2.2 **Push branch to GitHub**
```bash
   git push -u origin feature/<name>
   ```


   **Branch Naming Convention:**
   - `feature/training-courses` - For training course component
   - `feature/assessments` - For assessment & certification component
   - `feature/incident-reporting` - For incident & hazard reporting
   - `feature/compliance-auditing` - For compliance auditing component
   - `feature/your-name-task` - For individual tasks

3. **Start working on your feature!**
----
## 💻 Development Workflow

### Daily Workflow:

1. **Start of day - Pull latest changes:**
```bash
   git checkout dev
   git pull origin dev
   git checkout your-feature-branch
   git merge dev  # Merge latest dev changes into your branch
   ```

2. **Work on your feature:**
   - Write code
   - Test your endpoints
   - Commit regularly

3. **Commit your changes:**
```bash
   git add .
   git commit -m "Descriptive message about what you did"
   ```

4. **Push your feature branch:**
```bash
   git push origin your-feature-branch
   ```

5. **Create Pull Request (when feature is complete):**
   - Go to GitHub repository
   - Click "Pull Requests" → "New Pull Request"
   - Base: `dev` ← Compare: `your-feature-branch`
   - Add description of your changes
   - Request review from team members
   - Wait for approval before merging

---
## 📦 Project Components (Assignment Requirements)

Each team member will work on one of these components:

### ✅ Component 1: Training Course Manager + User Management - Nipuni
**Status:** In Progress → Done
- [x] User registration and login
- [x] Role-based access control
- [x] User profile management

**TODO:**
- [ ] Implement Course and Lesson CRUD (Create, Read, Update, Delete) operations.
- [ ] Manage user enrollment connecting workers to courses.
- [ ] Track worker course progress, including auto-saving completed lessons and tracking the last accessed lesson.
- [ ] Integrate YouTube Data API to automatically fetch video titles, thumbnails, and durations for training content.

### 📝 Component 2: Assessment & Certification System - Shirantha
**Endpoints / Features needed:**
- [ ] Create and manage Quiz and Question CRUD operations.
- [ ] Handle quiz attempt submissions with auto-marking for pass/fail results.
- [ ] Auto-generate digital certificates when a worker achieves a passing score.
- [ ] Enable public certificate verification using a unique certificate code.
- [ ] Integrate SendGrid Email API to automatically email digital certificates upon successful quiz completion.

### ⚠️ Component 3: Incident & Hazard Reporting - Navodya
**Endpoints / Features needed:**
- [ ] Submit new incident or hazard reports, including type (hazard/near-miss/accident) and severity classifications.
- [ ] View, track, and filter incident lists.
- [ ] Update incident statuses (e.g., Open, Investigating, Resolved).
- [ ] Add investigation comments and notes to specific incidents.
- [ ] Integrate Google Maps API to accurately select and display incident locations.

### 📊 Component 4: Compliance Auditing & Corrective Actions - Gayani
**Endpoints / Features needed:**
- [ ] Manage Audit Schedules and Checklist Templates via CRUD operations.
- [ ] Conduct audits by executing checklists, marking pass/fail, and logging findings.
- [ ] Create and assign corrective actions to users, setting due dates and priority levels.
- [ ] Track the completion status of assigned corrective actions.
- [ ] Integrate QuickChart API to generate simple analytics dashboard charts.


## 🔧 Useful Commands

### Git Commands:
```bash
# Check current branch
git branch

# Check status of files
git status

# See recent commits
git log --oneline -5

# Switch branches
git checkout branch-name

# Update your branch with dev changes
git checkout dev
git pull origin dev
git checkout your-feature-branch
git merge dev

# Undo uncommitted changes
git checkout -- filename
```

### NPM Commands (in backend folder):
```bash
# Start development server (auto-restart)
npm run dev

# Start production server
npm start

# Seed database
npm run seed

# Install new dependencies
npm install package-name
```

---

## 📝 Code Standards

### File Organization:
```
backend/
├── models/          # Mongoose schemas (User.js, Course.js, etc.)
├── controllers/     # Business logic (userController.js, etc.)
├── routes/          # API routes (userRoutes.js, etc.)
├── middleware/      # Auth, validation, error handling
├── utils/           # Helper functions
└── config/          # Configuration files
```

### API Response Format:
```javascript
// Success
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Commit Message Format:
```
Short description (50 chars or less)

- Bullet points for details
- What was changed
- Why it was changed
```

---

## 🧪 Testing Your API

### Using Postman:
1. Install Postman: https://www.postman.com/downloads/
2. Import the collection (if provided)
3. Set environment variables:
   - `base_url`: `http://localhost:5001/api`
   - `token`: (after login, save the JWT token here)

### Using cURL:
```bash
# Login
curl -X POST http://localhost:5001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@safebuild.com","password":"manager123"}'

# Get profile (replace TOKEN)
curl -X GET http://localhost:5001/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

See `backend/API_TESTING.md` for complete API documentation.

---

## 🆘 Common Issues & Solutions

### Issue: MongoDB connection error
**Solution**: Check your `.env` file has the correct password and connection string

### Issue: Port already in use
**Solution**: 
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Issue: Module not found
**Solution**: 
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Issue: Git merge conflicts
**Solution**: 
```bash
# See conflicting files
git status

# Edit files to resolve conflicts
# Then:
git add .
git commit -m "Resolve merge conflicts"
```

---

## 📞 Getting Help

### Ask Team Lead:
- MongoDB credentials
- API design questions
- Code review requests

### Resources:
- Express.js: https://expressjs.com/
- Mongoose: https://mongoosejs.com/
- JWT: https://jwt.io/

---

## 🎯 Assignment Requirements Checklist

For Evaluation 01, each component must have:
- [ ] At least 4 API endpoints working (CRUD operations)
- [ ] MongoDB integration established
- [ ] Protected routes with role-based access
- [ ] Input validation and error handling
- [ ] Clean code following best practices
- [ ] API documentation (Postman/README)

---

## 👥 Team Communication

- **Daily standups**: Share what you're working on
- **Code reviews**: Review each other's pull requests
- **GitHub Issues**: Use for tracking bugs/features
- **Commit often**: Small, frequent commits are better than large ones

---

Good luck with your development! 🚀

**Questions?** Ask in the team chat or contact the team lead.
