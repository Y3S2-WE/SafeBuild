# Quick Start Guide - SafeBuild Team

## ⚡ Quick Setup (5 Minutes)

### 1️⃣ Accept Invitation
Check email → Accept GitHub invitation

### 2️⃣ Clone & Setup
```bash
git clone https://github.com/YOUR_USERNAME/SafeBuild.git
cd SafeBuild
git checkout dev
git pull origin dev
```

### 3️⃣ Install & Configure
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add MongoDB password
```

### 4️⃣ Seed & Start
```bash
npm run seed
npm run dev
```

### 5️⃣ Test
Visit: http://localhost:5000/api/health

---

## 🌿 Working on Features

### Start New Feature:
```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
# Do your work...
git add .
git commit -m "Your changes"
git push origin feature/your-feature-name
# Create Pull Request on GitHub
```

### Daily Update:
```bash
git checkout dev
git pull origin dev
git checkout your-feature-branch
git merge dev
```

---

## 🔐 Test Accounts
- **Manager**: manager@safebuild.com / manager123
- **Officer**: officer@safebuild.com / officer123
- **Trainer**: trainer@safebuild.com / trainer123

---

## 📚 Full Documentation
See `TEAM_SETUP.md` for complete instructions!
