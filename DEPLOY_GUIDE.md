# 🚀 SafeBuild Deployment Guide

> **Backend → Railway** | **Frontend → Vercel** | **Database → MongoDB Atlas (already configured)**

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Pre-Deployment File Changes](#2-pre-deployment-file-changes)
3. [Deploy Backend to Railway](#3-deploy-backend-to-railway)
4. [Deploy Frontend to Vercel](#4-deploy-frontend-to-vercel)
5. [Post-Deployment Checks](#5-post-deployment-checks)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Prerequisites

Before you start, make sure you have:

- [ ] A [Railway](https://railway.app) account (sign up with GitHub)
- [ ] A [Vercel](https://vercel.com) account (sign up with GitHub)
- [ ] Your code pushed to a GitHub repository
- [ ] MongoDB Atlas connection is already working ✅

---

## 2. Pre-Deployment File Changes

> ⚠️ **These changes are REQUIRED before deploying. Do them first.**

### 2.1 — Fix CORS in `backend/server.js`

Currently, `cors()` is used without any origin restrictions. For production, you must allow only your Vercel frontend URL.

**Replace the current `app.use(cors())` line with:**

```js
// backend/server.js

// Replace this:
app.use(cors());

// With this:
const allowedOrigins = [
  process.env.FRONTEND_URL,       // Your Vercel URL (set in Railway env vars)
  'http://localhost:5173',        // Local development
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

### 2.2 — Create `backend/.env.example`

This file documents required environment variables (no secrets). Create it if it doesn't exist:

```env
# backend/.env.example
PORT=5000
NODE_ENV=production

MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/safebuild

JWT_SECRET=your_random_secret_here
JWT_EXPIRE=7d

OPENROUTER_API_KEY=sk-or-v1-...
HUGGINGFACE_API_KEY=hf_...

FRONTEND_URL=https://your-frontend.vercel.app
```

### 2.3 — Add `railway.json` to `backend/` (optional but recommended)

This tells Railway how to run your app:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

> 📁 Create this file at: `backend/railway.json`

### 2.4 — Add `vercel.json` to `frontend/`

This fixes **React Router** 404 errors on Vercel (page refresh will 404 without this):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> 📁 Create this file at: `frontend/vercel.json`

### 2.5 — Check `backend/package.json` start script

Confirm the `start` script exists (Railway uses this for production):

```json
"scripts": {
  "start": "node server.js",   ← ✅ already present
  "dev": "nodemon server.js",
  ...
}
```

✅ This is already correct. No changes needed.

### 2.6 — Ensure `.gitignore` excludes `.env` files

Your `.gitignore` already has:
```
.env
.env.*
!.env.example
```
✅ Good. Your secrets will **not** be uploaded to GitHub.

---

## 3. Deploy Backend to Railway

### Step 1 — Push your code to GitHub

```bash
cd /Users/shiranthadissanayake/Documents/GitHub/SafeBuild

git add .
git commit -m "chore: prepare for Railway + Vercel deployment"
git push origin main
```

### Step 2 — Create a Railway project

1. Go to [railway.app](https://railway.app) and log in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `SafeBuild` repository
5. Railway will detect the repo — **select the `backend` folder** as the root directory

   > If Railway doesn't ask you which directory, set it in **Settings → Source → Root Directory → `backend`**

### Step 3 — Configure Environment Variables in Railway

In your Railway project, go to **Variables** tab and add the following:

| Variable | Value |
|---|---|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://shiranthadw_db_user:...@y3s2.fsvshcc.mongodb.net/safebuild?retryWrites=true&w=majority` |
| `JWT_SECRET` | Use a **new strong random secret** for production |
| `JWT_EXPIRE` | `7d` |
| `OPENROUTER_API_KEY` | `sk-or-v1-8a6e31871bbaca8...` |
| `HUGGINGFACE_API_KEY` | `hf_RBrHxAxrOJUfyMSMcsjK...` |
| `FRONTEND_URL` | *(leave blank for now — fill after Vercel deploy)* |

> ⚠️ **Security Warning**: Change `JWT_SECRET` to a new secure random string for production.
> Generate one with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### Step 4 — Deploy

Railway will automatically build and deploy your backend.

- Watch the **Deploy Logs** tab for any errors
- Once deployed, Railway will give you a public URL like:
  ```
  https://safebuild-backend-production.up.railway.app
  ```

### Step 5 — Test your backend URL

Visit this in your browser:
```
https://YOUR_RAILWAY_URL.up.railway.app/api/health
```

You should see:
```json
{
  "success": true,
  "message": "SafeBuild API is running",
  "timestamp": "...",
  "environment": "production"
}
```

✅ **Copy your Railway URL** — you'll need it for the frontend.

---

## 4. Deploy Frontend to Vercel

### Step 1 — Create `frontend/.env.production` (local only, not committed)

This file is only used as a reference. The real env vars will be set in Vercel's dashboard.

```env
VITE_API_BASE_URL=https://YOUR_RAILWAY_URL.up.railway.app/api
VITE_MAPBOX_TOKEN=pk.eyJ1Ijoic2hpcmFudGhhMzIi...
```

### Step 2 — Deploy to Vercel

**Option A — Via Vercel Dashboard (Recommended)**

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **"Add New Project"**
3. Import your GitHub repository (`SafeBuild`)
4. In the **"Configure Project"** screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` ← **Important!**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Before clicking Deploy, go to **"Environment Variables"** and add:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://YOUR_RAILWAY_URL.up.railway.app/api` |
| `VITE_MAPBOX_TOKEN` | `pk.eyJ1Ijoic2hpcmFudGhhMzIi...your full token...` |

6. Click **"Deploy"** 🚀

**Option B — Via Vercel CLI**

```bash
npm install -g vercel

cd /Users/shiranthadissanayake/Documents/GitHub/SafeBuild/frontend

vercel --prod
# Follow prompts:
# - Set root directory to: frontend
# - Framework: Vite
# - Build command: npm run build
# - Output dir: dist
```

### Step 3 — Get your Vercel URL

After deployment, Vercel will give you a URL like:
```
https://safebuild.vercel.app
```

---

## 5. Post-Deployment Checks

### Step 1 — Update CORS in Railway

Go back to Railway **Variables** tab and update:

| Variable | Value |
|---|---|
| `FRONTEND_URL` | `https://safebuild.vercel.app` ← Your actual Vercel URL |

Railway will automatically redeploy with the new variable.

### Step 2 — Update MongoDB Atlas Network Access

If your MongoDB Atlas cluster has IP restrictions:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to **Network Access** → **Add IP Address**
3. Add **`0.0.0.0/0`** (Allow access from anywhere) for Railway
   > ⚠️ For better security, use Railway's static IP if you're on a paid plan.

### Step 3 — Test the full flow

Visit your Vercel URL and test:

- [ ] Login / Register
- [ ] Load courses
- [ ] View incident reports
- [ ] AI Chatbot (SafeBot)
- [ ] Translation feature
- [ ] Map picker on incident report

### Step 4 — Verify API calls in browser DevTools

Open **F12 → Network tab** and check API calls are going to your Railway URL, not `localhost`.

---

## 6. Troubleshooting

### ❌ Backend: `Module not found` errors on Railway

**Cause**: `node_modules` not installed.  
**Fix**: Ensure Railway is using the `backend/` folder as root. Check **Settings → Root Directory**.

---

### ❌ Frontend: Blank page or 404 on page refresh

**Cause**: React Router needs server-side redirect config.  
**Fix**: Make sure `frontend/vercel.json` exists with the rewrite rule from Step 2.4.

---

### ❌ CORS errors in browser console

**Cause**: `FRONTEND_URL` env var not set in Railway, or Vercel URL mismatch.  
**Fix**: 
1. Ensure `FRONTEND_URL` in Railway matches your exact Vercel URL (no trailing slash)
2. Redeploy the backend after updating env vars

---

### ❌ API calls still going to `localhost`

**Cause**: `VITE_API_BASE_URL` not set correctly in Vercel env vars.  
**Fix**:
1. Go to Vercel dashboard → Project → Settings → Environment Variables
2. Update `VITE_API_BASE_URL` to `https://YOUR_RAILWAY_URL.up.railway.app/api`
3. **Redeploy** (env var changes require a new deployment in Vercel)

---

### ❌ MongoDB connection fails on Railway

**Cause**: Atlas IP whitelist blocking Railway's IP.  
**Fix**: Go to MongoDB Atlas → Network Access → Allow `0.0.0.0/0`

---

### ❌ File uploads not persisting on Railway

**Cause**: Railway's filesystem is **ephemeral** — uploaded files are lost on redeploy.  
**Fix**: For production, migrate file uploads to a cloud storage service like:
- [Cloudinary](https://cloudinary.com) (free tier available)
- [AWS S3](https://aws.amazon.com/s3/)
- [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)

This is important if your app uses `multer` for file uploads (profile photos, documents, etc.).

---

## 📁 Summary of Files to Create/Modify

| File | Action | Reason |
|---|---|---|
| `backend/server.js` | **Modify** | Fix CORS to allow Vercel origin |
| `backend/railway.json` | **Create** | Railway deploy config |
| `backend/.env.example` | **Create** | Document required env vars |
| `frontend/vercel.json` | **Create** | Fix React Router on Vercel |

---

## 🔑 Environment Variables Summary

### Railway (Backend)

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=<your atlas URI>
JWT_SECRET=<new strong secret>
JWT_EXPIRE=7d
OPENROUTER_API_KEY=<your key>
HUGGINGFACE_API_KEY=<your key>
FRONTEND_URL=https://your-app.vercel.app
```

### Vercel (Frontend)

```env
VITE_API_BASE_URL=https://your-backend.up.railway.app/api
VITE_MAPBOX_TOKEN=<your mapbox token>
```

---

> 💡 **Tip**: Both Railway and Vercel support automatic re-deployments when you push to GitHub. After setup, just `git push` and both platforms redeploy automatically!
