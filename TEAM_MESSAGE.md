Subject: SafeBuild Project - Setup Instructions 🚀

Hi Team,

Welcome to the SafeBuild project! We're building an Occupational Safety Training & Certification web app for our SE3040 assignment.

## 📋 Quick Setup Instructions

**Step 1: Accept Repository Invitation**
- Check your email for the GitHub invitation
- Click and accept it

**Step 2: Clone the Repository**
```
git clone https://github.com/YOUR_USERNAME/SafeBuild.git
cd SafeBuild
```

**Step 3: Checkout Dev Branch**
```
git checkout dev
git pull origin dev
```

**Step 4: Backend Setup**
```
cd backend
npm install
cp .env.example .env
```

**Step 5: Configure Environment**
- Open `backend/.env` file
- Replace `<db_password>` with: [PROVIDE PASSWORD SEPARATELY]
- Save the file

**Step 6: Seed Database & Start Server**
```
npm run seed
npm run dev
```

**Step 7: Verify Setup**
- Open: http://localhost:5000/api/health
- You should see a success message ✅

## 📚 Full Documentation

We have two documentation files in the repo:

1. **TEAM_SETUP.md** - Complete setup guide with all details
2. **QUICKSTART.md** - Quick reference for common tasks

## 🎯 Your Tasks

Each team member will work on one component:

**Component 2: Assessment & Certification System** - [Assign Name]
**Component 3: Incident & Hazard Reporting** - [Assign Name]  
**Component 4: Compliance Auditing** - [Assign Name]

Component 1 (User Management) is already completed.

## 🔐 Test Accounts (Already Created)

- Manager: `manager@safebuild.com` / `manager123`
- Officer: `officer@safebuild.com` / `officer123`
- Trainer: `trainer@safebuild.com` / `trainer123`

## 🌿 Development Workflow

**When starting a new feature:**
```
git checkout dev
git pull origin dev
git checkout -b feature/your-component-name
# Do your work
git add .
git commit -m "Describe your changes"
git push origin feature/your-component-name
# Create Pull Request on GitHub
```

## ⚠️ Important Rules

1. **NEVER commit directly to `main` or `dev`**
2. **Always work in a feature branch**
3. **Create Pull Requests for all changes**
4. **Don't commit `.env` file** (it's in .gitignore)
5. **Commit often with clear messages**
6. **Pull latest dev changes daily**

## 📦 Assignment Requirements (Evaluation 01)

Each component needs:
- ✅ At least 4 API endpoints (CRUD)
- ✅ MongoDB integration
- ✅ Protected routes with authentication
- ✅ Validation and error handling
- ✅ Clean code structure
- ✅ API documentation

## 🆘 Need Help?

- Check `TEAM_SETUP.md` for troubleshooting
- Ask in our team chat
- Contact me: [Your Contact Info]

## 🗓️ Timeline

- **Week 1**: Setup + Component planning
- **Week 2-3**: Implementation
- **Week 4**: Testing + Documentation
- **Evaluation 01**: [Date]

Let's build something great! 💪

Best regards,
[Your Name]
Team Lead - SafeBuild

---

**MongoDB Password**: [Send this separately via secure channel]
**Repository**: https://github.com/[YOUR_USERNAME]/SafeBuild
