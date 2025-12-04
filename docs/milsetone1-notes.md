# Milestone 1 – Front-End Completion

## Overview
For Milestone 1, I set up the front-end virtual machine (TaskTitan-FE) and deployed the initial TaskTitan website layout. The frontend is served by Nginx on Ubuntu. The page includes both a dashboard/API status panel and a login UI.

## Website Layout
The main page displays:
- A TaskTitan dashboard section with a "Check API Status" button.
- A login section with username, password, and a "Sign In" button.

## API Connectivity
Nginx is configured as a reverse proxy:

- `/` serves the HTML frontend from `/var/www/tasktitan/index.html`.
- `/api/` proxies to the backend API on the TaskTitan-API VM (`http://10.0.0.20:3000/`).

The backend Node.js API responds with:
`{"message": "TaskTitan API running"}`

This confirms the frontend can communicate with the backend over the internal VirtualBox network.

## Result
- Basic website layout displayed ✅
- Login page UI displayed ✅
- Frontend hosted on its own VM ✅
- Nginx reverse proxy to backend API working ✅
