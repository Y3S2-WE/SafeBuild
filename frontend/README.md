# SafeBuild Frontend

Modern React + Tailwind frontend for SafeBuild.

## Setup

1. Install dependencies:
   npm install

2. Configure environment:
   cp .env.example .env

3. Start frontend:
   npm run dev

## Current Pages

- Home page with project branding
- Employee registration page (worker account creation)
- Shared login portal for manager, safety officer, trainer, and workers
- Protected portal landing page after login

## API Requirement

Backend should run on:
- http://localhost:5000

If backend is on another host, update VITE_API_BASE_URL in .env.
