# TaskTitan Deployment Guide

This guide explains how to deploy the TaskTitan authentication system to your VirtualBox VMs.

## Prerequisites

- TaskTitan-FE VM with Nginx installed
- TaskTitan-API VM with Node.js installed (for future milestones)
- VMs connected via VirtualBox Internal Network
- Git installed on your VMs
- Node.js and npm installed on your development machine

## Deployment Steps

### 1. Build the Frontend

On your development machine (or on the TaskTitan-FE VM if you have Node.js installed there):

```bash
# Navigate to project directory
cd TaskTitan

# Install dependencies (if not already done)
npm install

# Build the production-ready files
npm run build
```

This creates a `dist/` directory with all the compiled files ready for deployment.

### 2. Transfer Files to TaskTitan-FE VM

Option A: Using SCP (from your development machine)
```bash
# Copy the dist folder to the VM
scp -r dist/* student@tasktitan-fe:/tmp/tasktitan-build/
```

Option B: Using Git (clone on the VM)
```bash
# On TaskTitan-FE VM
ssh student@tasktitan-fe
git clone <your-repo-url> /tmp/tasktitan
cd /tmp/tasktitan
npm install
npm run build
```

### 3. Deploy to Nginx

On the TaskTitan-FE VM:

```bash
# Remove old files (if any)
sudo rm -rf /var/www/tasktitan/*

# Copy new build files
sudo cp -r dist/* /var/www/tasktitan/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/tasktitan
sudo chmod -R 755 /var/www/tasktitan
```

### 4. Update Nginx Configuration

Ensure your Nginx configuration supports single-page application routing:

```bash
sudo nano /etc/nginx/sites-available/tasktitan
```

Your configuration should look like this:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/tasktitan;
    index index.html;

    server_name _;

    # Serve the frontend app
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy /api/ to the backend API VM
    location /api/ {
        proxy_pass http://10.0.0.20:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Restart Nginx

```bash
# Test configuration
sudo nginx -t

# If test passes, restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### 6. Test the Deployment

1. Open a web browser
2. Navigate to your TaskTitan-FE VM's IP address
3. You should see the loading screen, then be redirected to the login page
4. Try creating an account and logging in

## Troubleshooting

### Issue: Blank page or 404 errors

**Solution:** Check Nginx configuration and ensure `try_files` directive is correct:
```nginx
try_files $uri $uri/ /index.html;
```

### Issue: JavaScript modules not loading

**Solution:** Ensure your Nginx configuration has the correct MIME types. Add to your server block:
```nginx
include /etc/nginx/mime.types;
default_type application/octet-stream;
```

### Issue: "Cannot GET /dashboard.html" when refreshing

**Solution:** This means your Nginx routing isn't configured properly. The `try_files` directive should catch all routes and serve index.html.

### Issue: Authentication not persisting after page refresh

**Solution:** Check browser console for errors. Ensure Supabase configuration is correct in the built files.

### Issue: Can't connect to backend API

**Solution:**
1. Verify backend is running on TaskTitan-API VM:
   ```bash
   ssh student@tasktitan-api
   curl http://localhost:3000
   ```

2. Check Nginx proxy configuration matches backend IP and port

3. Test from frontend VM:
   ```bash
   curl http://10.0.0.20:3000
   ```

## Verifying Deployment

After deployment, verify these key features:

1. **Landing page**: Navigate to your site - should see loading screen
2. **Auth redirect**: Should automatically redirect to login page
3. **Sign up**: Create a new account - should show success message
4. **Login**: Log in with created account - should redirect to dashboard
5. **Dashboard**: Should display your email and user info
6. **Protected route**: Try accessing `/dashboard.html` in new incognito tab - should redirect to login
7. **Logout**: Click logout - should redirect to login page
8. **Session persistence**: Log in, refresh page - should stay logged in
9. **API check**: Click "Check Backend API Status" - should connect to backend

## File Structure on VM

After deployment, your TaskTitan-FE VM should have this structure:

```
/var/www/tasktitan/
├── index.html
├── auth.html
├── dashboard.html
├── assets/
│   ├── index-[hash].js    # Main JavaScript bundle
│   └── [other assets]
└── lib/
    └── [if copied separately]
```

## Environment Variables

The `.env` file is NOT deployed to the VM. Instead, environment variables are compiled into the JavaScript bundle during the build process. The built files contain references to your Supabase URL and anonymous key, which is safe for public distribution.

## Security Notes

- Never commit `.env` file to version control
- The Supabase anonymous key is safe to expose in frontend code
- Always use HTTPS in production (set up SSL certificates for your Nginx server)
- Row Level Security (RLS) in Supabase protects your data even with public keys

## Next Steps

After successful deployment of Milestone 2:
1. Test all authentication features thoroughly
2. Document any issues or edge cases
3. Prepare for Milestone 3: Task management and MFA implementation
