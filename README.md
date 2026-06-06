# SF Validation Manager

A web application to manage Salesforce Account validation rules. Built with Django (backend) and React (frontend).

## What it does

- Login with your Salesforce org using OAuth 2.0
- Fetch all validation rules from the Account object via Tooling API
- View each rule's name, error message, and active/inactive status
- Toggle individual rules on or off
- Enable or disable all rules at once
- Deploy all pending changes to Salesforce with a single click

## Tech Stack

- **Backend:** Python, Django, Django REST Framework
- **Frontend:** React, Vite, Axios, React Router
- **Auth:** Salesforce OAuth 2.0 Web Server Flow
- **API:** Salesforce Tooling API (v59.0)

## Project Structure

```
sf-validation-manager/
├── backend/
│   ├── sfauth/        # OAuth login, callback, logout views
│   ├── rules/         # Tooling API - fetch, toggle, deploy rules
│   ├── sfmanager/     # Django project settings and urls
│   ├── .env           # environment variables (not committed)
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/       # axios api helper functions
    │   ├── components/# RuleCard component
    │   └── pages/     # LoginPage and Dashboard
    ├── vite.config.js
    └── package.json
```

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Salesforce Developer Org
- A Connected App with OAuth enabled

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Environment Variables

Create a `.env` file in the `backend/` directory:

```
SF_CLIENT_ID=consumer_key
SF_CLIENT_SECRET=consumer_secret
SF_DOMAIN=https://org.my.salesforce.com
REDIRECT_URI=http://localhost:8000/auth/callback/
SECRET_KEY=your_django_secret_key
DEBUG=True
FRONTEND_URL=http://localhost:5173
```

## How the OAuth Flow Works

1. User clicks "Login with Salesforce" on the frontend
2. Browser redirects to Django `/auth/login/` endpoint
3. Django redirects to Salesforce login page
4. User authorizes the app on Salesforce
5. Salesforce redirects back to `/auth/callback/` with an authorization code
6. Django exchanges the code for an access token
7. Access token is stored in the server session
8. User is redirected to the React dashboard

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /auth/login/ | Initiates Salesforce OAuth flow |
| GET | /auth/callback/ | Handles OAuth callback from Salesforce |
| GET | /auth/status/ | Returns current login status |
| POST | /auth/logout/ | Revokes token and clears session |
| GET | /api/rules/ | Fetches all Account validation rules |
| POST | /api/rules/{id}/toggle/ | Toggles a single rule active/inactive |
| POST | /api/rules/deploy/ | Deploys multiple rule changes at once |

Used ChatGPT only to refine this README file.
