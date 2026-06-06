# SF Validation Manager

A web app I built to manage Salesforce Account validation rules directly from a browser — no need to log into Salesforce setup every time.

Built as part of an assignment for CloudVandana.

## What it does

- Login to your Salesforce org using OAuth 2.0
- Fetch all validation rules on the Account object
- See which rules are active or inactive
- Toggle individual rules on or off
- Enable or disable all rules at once
- Deploy changes back to Salesforce with one click

## Tech Stack

- **Backend:** Python, Django, Django REST Framework
- **Frontend:** React, Vite, Axios, React Router
- **Auth:** Salesforce OAuth 2.0 (Web Server Flow)
- **Salesforce API:** Tooling API v59.0

## Project Structure

sf-validation-manager/
├── backend/
│   ├── sfauth/        # handles oauth login, callback, logout
│   ├── rules/         # fetching, toggling and deploying rules
│   ├── sfmanager/     # django settings and main urls
│   ├── manage.py
│   └── requirements.txt
└── frontend/
├── src/
│   ├── api/         # axios calls to backend
│   ├── components/  # RuleCard component
│   └── pages/       # LoginPage and Dashboard
└── package.json

## How to run locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000

## Environment Variables

Create a `.env` file inside the `backend/` folder:

SF_CLIENT_ID=your_consumer_key
SF_CLIENT_SECRET=your_consumer_secret
SF_DOMAIN=https://yourorg.my.salesforce.com
REDIRECT_URI=http://localhost:8000/auth/callback/
SECRET_KEY=your_django_secret_key
DEBUG=True
FRONTEND_URL=http://localhost:5173

## How login works

1. User clicks "Login with Salesforce"
2. Gets redirected to Salesforce login page
3. After logging in, Salesforce sends back an authorization code
4. Backend exchanges that code for an access token
5. Token gets stored and user lands on the dashboard

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /auth/login/ | starts the oauth flow |
| GET | /auth/callback/ | salesforce redirects here after login |
| GET | /auth/status/ | checks if user is logged in |
| POST | /auth/logout/ | clears session and revokes token |
| GET | /api/rules/ | gets all account validation rules |
| POST | /api/rules/{id}/toggle/ | toggles one rule on or off |
| POST | /api/rules/deploy/ | deploys multiple rule changes |

## Live Demo

https://sf-validation-manager-tau.vercel.app
