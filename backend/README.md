# ServerUp Backend

Minimal Node.js/Express backend for the ServerUp project.

Prerequisites
- Node.js (16+ recommended)

Install

Run these commands in PowerShell from the `backend` folder:

```powershell
npm install
```

Run

Start the server:

```powershell
npm start
```

For development with automatic reload (requires nodemon):

```powershell
npm run dev
```

Endpoints
- GET /health — basic health check
- GET /api — example GET
- POST /api/echo — echoes JSON body
