# MediQueue — Frontend

React frontend for the MediQueue virtual queue system.

## Setup

```bash
npm install
npm start
```

The app runs on `http://localhost:3000`.

## Environment

Create a `.env` file in the root if your backend runs on a different port:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## File Structure

```
src/
├── services/
│   └── api.js               # All API calls (getDoctors, joinQueue, etc.)
├── components/
│   ├── Navbar.jsx / .module.css
│   ├── DoctorCard.jsx / .module.css
│   ├── JoinQueueModal.jsx / .module.css
│   ├── QueueList.jsx / .module.css
│   └── StatusChecker.jsx / .module.css
├── pages/
│   ├── PatientPage.jsx / .module.css
│   └── AdminPage.jsx / .module.css
├── App.js                   # Router setup
├── index.js                 # Entry point
└── index.css                # Global styles + CSS variables
```

## Pages

| Route | Description |
|---|---|
| `/patient` | Browse doctors, join a queue, check your status |
| `/admin` | Select a doctor, view live queue, call next patient |
