# UR Fit

UR Fit is a campus wellness challenge platform with separate participant and coordinator experiences. The interface is built in React, and the backend API is built in Express with MongoDB.

## What’s in this repo

- `client/` — the React frontend
- `server/` — the Express backend and database logic
- `README.md` — setup instructions and usage notes

## Prerequisites

- Node.js installed locally
- MongoDB available locally or in the cloud

## Setup

1. Open a terminal and go to the project folder.
2. Install frontend dependencies:

   ```bash
   cd client
   npm install
   ```

3. Install backend dependencies:

   ```bash
   cd ../server
   npm install
   ```

## Environment configuration

Create a `.env` file inside the `server/` folder with at least the following values:

```env
PORT=3002
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
```

For example, if you are using MongoDB Atlas, `MONGO_URI` should include the connection string from your cluster.

## Running the app

Run the backend and frontend in separate terminals.

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

The frontend should start in the browser using the local Vite development server. The backend should run on the configured port from `server/.env`.

## How authentication works

This app uses JSON Web Tokens (JWT) for user sessions.

- After login, the frontend stores the token in browser local storage under the key `token`.
- The frontend sends this token with protected API requests.
- Protected routes will reject access if the token is missing or invalid.

### Finding the JWT token

1. Log in through the app.
2. Open browser developer tools.
3. Inspect `localStorage` and look for `token`.

If you want to inspect it manually, open the console and run:

```js
localStorage.getItem('token')
```

## Quick test flow

1. Start the backend.
2. Start the frontend.
3. Sign up or log in as a user.
4. Create a challenge as a coordinator or join one as a participant.
5. Confirm protected pages require login.

