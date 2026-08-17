# UR Fit
UR Fit is a campus wellness challenge platform. Participants join challenges, record daily activities, earn points, and view leaderboards. Coordinators create challenges and manage participants.

## Requirements
- Node.js LTS: https://nodejs.org/
- MongoDB Community Edition
- MongoDB Compass is optional

## MongoDB Setup
The app connects to `mongodb://127.0.0.1:27017/ur-fit`.

### Windows
Download the Community Server MSI from https://www.mongodb.com/try/download/community. Choose **Complete** during installation and keep **Install MongoD as a Service** selected. If MongoDB is not running, open PowerShell as Administrator and run `net start MongoDB`.

### macOS
Install Homebrew from https://brew.sh/ if needed, then run:
```bash
brew tap mongodb/brew
brew update
brew install mongodb-community@8.0
brew services start mongodb-community@8.0
```
If Homebrew lists a newer version, use that version in both MongoDB commands.

### Test the connection
On either system, run `mongosh "mongodb://127.0.0.1:27017/ur-fit"`. If it opens, MongoDB is running; type `exit` to close it. For Compass, use `mongodb://127.0.0.1:27017`.

## Project Setup
Open a terminal in the project root, the folder containing `client` and `server`:
```bash
cd client
npm install
cd ../server
npm install
```
Create `server/.env` with:
```env
PORT=3002
MONGO_URI=mongodb://127.0.0.1:27017/ur-fit
JWT_SECRET=local-development-secret
```
MongoDB creates the `ur-fit` database automatically when the app first saves data.

## Run the App
Keep two terminals open. In Terminal 1, run `cd server` followed by `npm run dev`. In Terminal 2, run `cd client` followed by `npm run dev`.

Open the Vite URL, normally `http://localhost:5173`. The backend runs on port `3002`.

## Quick Test
Create a coordinator account and a challenge. In another browser window, create a participant account, join the challenge, submit a daily log, and open the challenge details page to view the leaderboard.

## Troubleshooting
- `ECONNREFUSED 127.0.0.1:27017`: start MongoDB using the platform command above, then restart the backend.
- macOS `mongosh: command not found`: close and reopen Terminal after installing MongoDB.
- Compass cannot connect: use `mongodb://127.0.0.1:27017`, not `http://localhost:5173`.
- The frontend cannot load data: check MongoDB, port `3002`, and `server/.env`.

## Checks
From `client`, run `npm run lint` and `npm run build`.