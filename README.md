# TaskTitan - IT340 Project

This repository contains the frontend (and later backend) configuration for the TaskTitan project.

- Frontend VM: TaskTitan-FE (Nginx + Vite/JavaScript)
- Backend VM: TaskTitan-API (Node.js + Express)
- Database: Supabase (Authentication & Data)
- VirtualBox Internal Network is used so VMs can communicate privately.

## Project Milestones

- ✅ **Milestone 1** (Nov 14): Front-End Completion - Basic website layout and login page displayed
- ✅ **Milestone 2** (Dec 5): Authentication Completion - User login system with basic security
- ⏳ **Milestone 3** (Dec 19): Full Website Functionality - Complete CRUD, database integration, MFA

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Deployment to TaskTitan-FE VM

```bash
# Build the project
npm run build

# Copy built files to Nginx directory
sudo cp -r dist/* /var/www/tasktitan/

# Restart Nginx
sudo systemctl restart nginx
```

## Features

### Milestone 2 - Authentication System
- User registration with email and password
- Secure login with JWT session management
- Protected dashboard for authenticated users
- Logout functionality
- Automatic session persistence
- Security best practices (password hashing, secure tokens)

See `docs/milestone2-notes.md` for detailed implementation notes.

## Project Structure

```
TaskTitan/
├── frontend/
│   ├── index.html           # Landing page with auth routing
│   ├── auth.html            # Login and signup page
│   ├── dashboard.html       # Protected user dashboard
│   ├── lib/
│   │   ├── supabase.js      # Supabase client
│   │   └── auth.js          # Authentication functions
│   └── nginx-tasktitan.conf # Nginx configuration
├── docs/
│   ├── milestone1-notes.md  # Milestone 1 documentation
│   └── milestone2-notes.md  # Milestone 2 documentation
├── package.json
├── vite.config.js
└── .env                      # Supabase configuration
```
