# UR Fit — Complete Code Review & Defense Guide

**Purpose:** Walk your professor through the entire project — architecture, authentication, every file, demo flow, and the technical problems you solved.

**Stack:** React (Vite) + Express + MongoDB (local via Compass) + JWT authentication

**Roles:** `participant` (join/view challenges) · `coordinator` (create/manage/enroll)

---

## Table of Contents

1. [Elevator Pitch (30 seconds)](#1-elevator-pitch-30-seconds)
2. [Architecture Overview](#2-architecture-overview)
3. [Authentication — Full Deep Dive](#3-authentication--full-deep-dive)
4. [Server — Every File Explained](#4-server--every-file-explained)
5. [Client — Every File Explained](#5-client--every-file-explained)
6. [Database Design & Relationships](#6-database-design--relationships)
7. [API Endpoints Reference](#7-api-endpoints-reference)
8. [Technical Difficulties & How You Solved Them](#8-technical-difficulties--how-you-solved-them)
9. [Live Demo Script (Step-by-Step)](#9-live-demo-script-step-by-step)
10. [Professor Q&A — Prepared Answers](#10-professor-qa--prepared-answers)
11. [Known Limitations (Honest Improvements)](#11-known-limitations-honest-improvements)
12. [Quick File Index](#12-quick-file-index)

---

## 1. Elevator Pitch (30 seconds)

> "UR Fit is a campus wellness challenge platform. Participants can browse wellness challenges, join them, and view resources like links and PDFs. Coordinators can create challenges, upload images, edit content, manually enroll users, and delete challenges.
>
> The frontend is React with Material UI and React Router. The backend is a REST API built with Express and Mongoose connected to MongoDB. Authentication uses bcrypt for password hashing and JWT tokens for session management. The app separates participant and coordinator experiences based on the user's role stored in the token."

---

## 2. Architecture Overview

### 2.1 Folder structure

```
ur-fit/
├── client/          → React frontend (Vite dev server, port 5173)
├── server/          → Express API (port 3002)
├── README.md        → Setup instructions
└── server/.env      → Secrets (NOT in git): PORT, MONGO_URI, JWT_SECRET
```

### 2.2 How a request travels through the app

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER (React)                                                │
│  localhost:5173                                                 │
│                                                                 │
│  User clicks "Join Challenge"                                   │
│       ↓                                                         │
│  api.js → axios POST with Authorization: Bearer <token>       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  EXPRESS SERVER                                                 │
│  localhost:3002                                                 │
│                                                                 │
│  challengeRoutes.js → auth middleware → challengeController     │
│       ↓                                                         │
│  mongoose → MongoDB (Compass / local)                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Why two terminals?

- **Terminal 1:** `cd server && npm run dev` — API + database
- **Terminal 2:** `cd client && npm run dev` — React UI

They are separate processes. The frontend talks to the backend over HTTP.

### 2.4 Vite proxy (development only)

File: `client/vite.config.js`

```javascript
proxy: {
  '/api': 'http://localhost:3002',
  '/public': 'http://localhost:3002'
}
```

This means:
- `fetch("/api/upload", ...)` from the React app hits the Express server
- Image URLs like `/public/1234-photo.jpg` also proxy to the backend

Most API calls in `api.js` use the full URL `http://localhost:3002/api` instead of relying on the proxy.

### 2.5 Environment variables (`server/.env`)

| Variable     | Purpose                                      |
|-------------|----------------------------------------------|
| `PORT=3002` | Must match what the frontend expects         |
| `MONGO_URI` | MongoDB connection (local Compass example: `mongodb://127.0.0.1:27017/urfit`) |
| `JWT_SECRET`| Secret key used to sign and verify JWT tokens |

**JWT_SECRET** is a string you create yourself — it is NOT downloaded from anywhere.  
**JWT token** (in browser localStorage) is generated at login — different thing entirely.

---

## 3. Authentication — Full Deep Dive

This is the section your professor will likely focus on. Know every step.

### 3.1 Signup flow

**Frontend:** `client/src/components/auth/signup.jsx`

1. User fills: name, email, password, role (participant or coordinator radio buttons)
2. Form submits → calls `signup(formData)` from `api.js`
3. `api.js` sends `POST http://localhost:3002/api/auth/signup` with JSON body
4. On success: shows "Signup successful! Redirecting to login..." → navigates to `/login` after 1.5 seconds
5. On error: displays message from server (e.g. "Email already exists")

**Backend:** `server/routes/authRoutes.js` → `server/controllers/authController.js` → `signup()`

1. Extracts `{ name, email, password, role }` from request body
2. **Normalizes email:** `email.toLowerCase()` — prevents duplicate accounts like `User@mail.com` vs `user@mail.com`
3. Checks if user already exists: `User.findOne({ email: normalizedEmail })`
4. If exists → 400 "Email already exists"
5. **Hashes password:** `bcrypt.hash(password, 10)` — 10 salt rounds; plain password never stored
6. Creates new User document and saves to MongoDB
7. Returns 201 "Signup successful"

**Why bcrypt?** One-way hashing. Even if the database is leaked, attackers cannot reverse passwords easily.

**Model:** `server/models/User.js` — defines schema with required fields and `role` enum.

---

### 3.2 Login flow

**Frontend:** `client/src/components/auth/login.jsx`

1. User enters email + password
2. Calls `login(formData)` from `api.js` → `POST /api/auth/login`
3. Server returns `{ token, user: { id, name, email, role } }`
4. Frontend stores token: `localStorage.setItem("token", res.data.token)`
5. Decodes token client-side: `jwtDecode(res.data.token)` to read `role` without another API call
6. **Role-based redirect:**
   - `coordinator` → `/coordinator-challenges`
   - `participant` → `/challenges`

**Backend:** `authController.login()`

1. Normalize email to lowercase
2. Find user: `User.findOne({ email: normalizedEmail })`
3. If not found → 400 "Invalid credentials" (same message as wrong password — don't reveal which failed)
4. Compare password: `bcrypt.compare(password, user.password)` against stored hash
5. If no match → 400 "Invalid credentials"
6. **Generate JWT:**
   ```javascript
   jwt.sign(
     { userId: user._id, name: user.name, email: user.email, role: user.role },
     process.env.JWT_SECRET,
     { expiresIn: "2h" }
   )
   ```
7. Return token + user object (without password)

**What's inside the JWT payload?**
- `userId` — MongoDB ObjectId as string
- `name`, `email`, `role`
- Standard JWT fields: `iat` (issued at), `exp` (expires — 2 hours from login)

---

### 3.3 How protected API routes work (server)

**File:** `server/middleware/auth.js`

Every protected route uses this middleware before the controller runs.

```
Request comes in
    ↓
Read header: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
    ↓
Missing or not "Bearer "?  → 401 "No token, authorization denied"
    ↓
jwt.verify(token, JWT_SECRET)
    ↓
Invalid/expired?  → 401 "Token is not valid"
    ↓
Valid? Attach decoded payload to req.user → call next()
    ↓
Controller uses req.user.userId and req.user.role
```

**Example:** `joinChallenge` in `challengeController.js`:
```javascript
const userId = req.user.userId  // from JWT, not from request body (secure)
```

**Why not send userId in the body?** A malicious user could send someone else's ID. The JWT proves identity.

---

### 3.4 How protected pages work (client)

There is **no global AuthContext**. Each protected page does its own check:

```javascript
const token = localStorage.getItem("token")
let user = null
try {
  if (token) user = jwtDecode(token)
} catch {
  user = null
}

useEffect(() => {
  if (!user) {
    navigate("/login")
    return
  }
  if (user.role === "coordinator") {
    navigate("/coordinator-challenges")  // wrong role for this page
    return
  }
  // ... fetch data
}, [])
```

**Pages with this pattern:**
- `Challenges.jsx` — participants only
- `CoordinatorChallenges.jsx` — coordinators only
- `ChallengeDetails.jsx` — participants only
- `CoordinatorManageChallenge.jsx` — coordinators only
- `EnrollUser.jsx` — coordinators only

**Logout (all pages):**
```javascript
localStorage.removeItem("token")
navigate("/login")
```

---

### 3.5 Auth security model — what to tell your professor

| Layer              | What it protects                          |
|--------------------|-------------------------------------------|
| bcrypt hashing     | Passwords at rest in MongoDB              |
| JWT signing        | Tokens can't be forged without JWT_SECRET |
| auth middleware    | API routes reject bad/missing tokens      |
| Role checks        | e.g. `userEnrollment` checks coordinator  |
| Client redirects   | UX only — not real security               |

**Key sentence:** "Real authorization happens on the server. The frontend redirects are for user experience."

---

### 3.6 Auth file map

| File | Role in auth |
|------|--------------|
| `server/models/User.js` | Stores hashed password + role |
| `server/controllers/authController.js` | signup, login, getAllUsers |
| `server/routes/authRoutes.js` | POST /signup, POST /login |
| `server/middleware/auth.js` | JWT verification |
| `client/src/components/auth/signup.jsx` | Registration UI |
| `client/src/components/auth/login.jsx` | Login UI + token storage |
| `client/src/services/api.js` | HTTP calls + Bearer headers |

---

## 4. Server — Every File Explained

### 4.1 `server/server.js` — Application entry point

**What it does:**
1. `dotenv.config()` — loads `.env`
2. `connectDB()` — connects to MongoDB
3. Creates Express app
4. `app.use(cors())` — allows frontend (different port) to call API
5. `app.use(express.json())` — parses JSON request bodies
6. `app.use("/public", express.static(...))` — serves uploaded images
7. Registers route modules under `/api/auth`, `/api/challenges`, `/api/upload`, `/api/users`
8. `app.listen(PORT)` — default 5000 if PORT not set (your `.env` must set 3002)

**Say:** "This is the main entry point. It wires middleware, static files, and all API route groups."

---

### 4.2 `server/config/db.js` — Database connection

**What it does:**
- Async function using `mongoose.connect(process.env.MONGO_URI)`
- Success → logs "MongoDB connected"
- Failure → logs error and `process.exit(1)` so the server doesn't run half-broken

**Say:** "Separated DB connection into its own module so server.js stays clean."

---

### 4.3 `server/models/User.js` — User schema

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| name | String | required |
| email | String | required, unique |
| password | String | required, stores bcrypt hash |
| role | String | enum: "participant" \| "coordinator" |
| joinedChallenges | [ObjectId] | refs Challenge model |
| createdAt, updatedAt | Date | auto via timestamps |

**Say:** "Mongoose gives us schema validation, unique email constraint, and automatic timestamps."

---

### 4.4 `server/models/Challenge.js` — Challenge schema

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| title, description | String | required |
| longDescription | String | optional, shown on detail pages |
| startDate, endDate | Date | required |
| participants | [ObjectId] | refs User |
| participantCount | Number | cached count, default 0 |
| imageUrl | String | path like /public/timestamp-file.jpg |
| externalLink | [String] | array of URLs |
| pdfs | [String] | array of PDF URLs |

---

### 4.5 `server/controllers/authController.js`

**Functions:**

**`signup(req, res)`**
- Validates uniqueness, hashes password, saves user
- Does NOT return a token (user must log in separately)

**`login(req, res)`**
- Validates credentials, returns JWT + user info

**`getAllUsers(req, res)`**
- Returns all users where `role === "participant"`
- Uses `.select("-password")` equivalent via second arg to find: `"-" + password` field exclusion
- Used by coordinator enrollment page

---

### 4.6 `server/controllers/challengeController.js` — Largest file, core business logic

**Helper functions (important — show you understand dates):**

```javascript
parseLocalDate(dateString)  // YYYY-MM-DD → local Date object
getTodayLocal()             // today at midnight local time
```

**`createChallenge`**
- Validates required fields: title, description, startDate, endDate
- Validates startDate >= today
- Validates endDate > startDate
- Saves new Challenge document

**`getChallenges`**
- `Challenge.find().populate("participants", "name email")` — joins user data for display

**`getChallengeById`**
- Single challenge by MongoDB `_id` from URL param
- 404 if not found

**`joinChallenge`**
- Gets `userId` from `req.user.userId` (JWT)
- Prevents duplicate: checks if userId already in `participants` array
- Pushes userId to `challenge.participants`
- Updates `participantCount`
- Also updates user: `$addToSet: { joinedChallenges: challengeId }` — `$addToSet` prevents duplicates

**`getUserJoinedChallenges`**
- Finds user by JWT userId, populates `joinedChallenges` with full challenge documents

**`userEnrollment`** (coordinator only)
- Checks `req.user.role !== "coordinator"` → 403
- Takes `{ userId, challengeId }` from body
- Same dual-update as joinChallenge but coordinator picks the user

**Link/PDF CRUD (index-based)**
- `addChallengeLink`, `updateSingleChallengeLink`, `deleteSingleChallengeLink`
- Same pattern for PDFs
- Updates arrays by index — frontend sends `{ index, newLink }` etc.

**`editChallenge`**
- Partial update: only changes fields that were sent
- Re-validates dates if dates are being changed

**`deleteChallenge`**
- `Challenge.findByIdAndDelete(id)`
- Cleanup: `User.updateMany({ joinedChallenges: id }, { $pull: { joinedChallenges: id } })`
- Prevents orphaned references in user documents

---

### 4.7 `server/routes/challengeRoutes.js` — Route definitions

**Critical route order (memorize this):**

```javascript
router.get("/joined/me", auth, getUserJoinedChallenges)  // MUST be before /:id
router.get("/:id", getChallengeById)
```

If reversed, Express treats `"joined"` as an `:id` parameter → broken endpoint.

**Auth required on:**
- POST `/` (create)
- GET `/joined/me`
- POST `/:id/join`
- POST `/enroll`
- All link/pdf/edit/delete routes

**Public (no auth):**
- GET `/` (all challenges)
- GET `/:id` (single challenge — token optional on client)

---

### 4.8 `server/routes/authRoutes.js`

- `POST /signup` → signup
- `POST /login` → login

Mounted at `/api/auth` in server.js → full paths: `/api/auth/signup`, `/api/auth/login`

---

### 4.9 `server/routes/userRoutes.js`

- `GET /` → getAllUsers (participants only, no passwords)

Mounted at `/api/users` → `/api/users`

**Note:** No auth middleware currently — acknowledge as improvement area.

---

### 4.10 `server/routes/uploadImageRoutes.js`

**Multer configuration:**
- Storage: disk storage in `server/public/`
- Filename: `Date.now() + "-" + originalname` — unique names, no overwrites

**Route:** `POST /` with field name `"image"` (must match frontend FormData)

**Response:** `{ imageUrl: "/public/1234567890-photo.png" }`

Frontend saves this URL on the challenge document when creating.

---

### 4.11 `server/package.json`

**Runtime dependencies:**
- express — web framework
- mongoose — MongoDB ODM
- bcryptjs — password hashing
- jsonwebtoken — JWT create/verify
- cors — cross-origin requests
- dotenv — environment variables
- multer — file uploads

**Dev:** nodemon — auto-restart on file changes (`npm run dev`)

---

## 5. Client — Every File Explained

### 5.1 Entry & config files

**`client/index.html`**
- HTML shell with `<div id="root">` where React mounts

**`client/src/main.jsx`**
- `ReactDOM.createRoot(...).render(...)`
- Wraps app in `ThemeProvider` (MUI theming)
- `React.StrictMode` for development checks

**`client/vite.config.js`**
- Vite + React plugin
- Dev server proxy to backend (see Section 2.4)

**`client/src/theme.js`**
- MUI `createTheme`: primary blue, rounded buttons/inputs, no uppercase button text

**`client/src/index.css` / `App.css`**
- Global CSS resets and app-wide styles

**`client/eslint.config.js`**
- ESLint rules for React (standard Vite template)

**`client/package.json`**
- React 19, MUI 7, axios, jwt-decode, react-router-dom 7, Vite 6

---

### 5.2 `client/src/App.jsx` — Routing

Uses `BrowserRouter` + `Routes` + `Route`:

| Path | Component | Audience |
|------|-----------|----------|
| `/` | Home | Everyone |
| `/signup` | SignUpPage | Guests |
| `/login` | LoginPage | Guests |
| `/challenges` | Challenges | Participants |
| `/coordinator-challenges` | CoordinatorChallenges | Coordinators |
| `/challenges/:id` | ChallengeDetails | Participants |
| `/coordinator/challenges/:id` | CoordinatorManageChallenge | Coordinators |
| `/enrollment` | EnrollUser | Coordinators |

**Say:** "React Router handles client-side navigation — no full page reloads when switching views."

---

### 5.3 `client/src/services/api.js` — API layer

**Design pattern:** Single Axios instance + exported functions per endpoint.

**Why centralize?**
- One place to change base URL
- Consistent Authorization header pattern
- Pages stay focused on UI, not HTTP details

**Auth endpoints:**
- `signup(formData)` — no token needed
- `login(formData)` — no token needed

**Protected endpoints:** all accept `token` and send:
```javascript
headers: { Authorization: `Bearer ${token}` }
```

**Inconsistency to know about:**
- `editChallenge` and `deleteChallenge` use `axios.put("/api/challenges/...")` — relative URL, uses Vite proxy
- Everything else uses `http://localhost:3002/api/...`
- Both work in development; production would need one approach

---

### 5.4 Pages — detailed

#### `Home.jsx`
- Landing page
- Checks `localStorage.getItem("token")` — if exists, show "Go to Dashboard" button
- If not logged in, show Login + Sign Up buttons
- Simple gate — doesn't decode JWT or check role

#### `Challenges.jsx` — Participant dashboard

**State:**
- `allChallenges`, `joinedChallenges` — two data sources
- `tab` — 0 = All Challenges, 1 = My Challenges (persisted in localStorage as `challengesTab`)
- `search` — filters by title/description
- `useExpandedView` — toggles between `ChallengeCard` and `ExpandedChallengeCard`
- `snackbar` — success toast after joining

**On mount:**
- Redirect if not logged in
- Redirect coordinators to `/coordinator-challenges`
- Fetch both challenge lists in parallel

**`handleJoin(challengeId)`:**
- Calls `joinChallenge(challengeId, token)`
- Refetches both lists
- Shows snackbar confirmation

**`isJoined(challengeId)`:**
- Checks if challenge ID exists in `joinedChallenges` array — drives button disabled state

#### `CoordinatorChallenges.jsx` — Coordinator dashboard

- Lists all challenges in a grid
- Search filter
- "Create New Challenge" opens `ChallengeModal`
- `handleCreateChallenge` calls API, closes modal, refreshes list
- Uses `ChallengeCard` with `isCoordinator={true}` → shows "Edit Challenge" instead of Join

#### `ChallengeDetails.jsx` — Participant read-only view

- Gets challenge ID from URL: `useParams().id`
- Fetches via `getChallengeById(id, token)`
- Layout: image left, details right; links and PDFs in two columns below
- Back button → `/challenges`
- Uses same `parseLocalDate` / `formatDate` helpers as server-side logic

#### `CoordinatorManageChallenge.jsx` — Coordinator full edit view

**Features:**
- View mode: title, description, dates as chips, participant count
- Edit mode: TextFields for all fields including date inputs with `min` constraints
- `EditableList` for links and PDFs (inline edit, add, delete)
- Delete button → confirmation Dialog → `deleteChallenge` → navigate back

**Edit flow:**
1. Click Edit → `editMode = true`, fields pre-filled from challenge
2. Click Save → `editChallenge(id, editFields, token)` → refetch challenge
3. Click Cancel → discard local edits

#### `EnrollUser.jsx` — Coordinator enrollment table

**Flow:**
1. Load all participants (`getAllUsers`) and all challenges (`getAllChallenges`)
2. Coordinator selects a challenge from dropdown
3. When challenge selected → fetch that challenge's `participants` array → build `enrolledUserIds`
4. Table shows each participant: "Enrolled" (green) or "Enroll" button
5. Click Enroll → `userEnrollment({ userId, challengeId }, token)` → refresh enrolled list

**Search:** filters table by name or email

---

### 5.5 Components — detailed

#### `Navbar.jsx`
- Props: `user` (decoded JWT or null), `onLogout` callback
- Always shows: Home, Challenges links
- Coordinators only: Enrollment link
- Auth buttons logic:
  - Logged in → Logout button
  - On signup page → Sign In button
  - On login page → Sign Up button
  - Else → both Sign In and Sign Up

#### `ChallengeCard.jsx`
- Compact card: image, title (link), description, date chip, participant count
- **Link destination depends on role:**
  - coordinator → `/coordinator/challenges/:id`
  - participant → `/challenges/:id`
- Button: "Join Challenge" / "Already Joined" OR "Edit Challenge" for coordinators
- Contains `parseLocalDate` + `formatDate` for display

#### `ExpandedChallengeCard.jsx`
- Horizontal layout: content left (70%), image right (30%)
- Shows truncated longDescription
- Same join/edit logic as ChallengeCard
- Used when participant toggles "Detailed View" on Challenges page

#### `ChallengeModal.jsx`
- Dialog for creating new challenges
- **Client-side validation** mirrors server:
  - Required fields
  - Start date not before today
  - End date after start date
- **Image upload flow:**
  1. User selects file → stored in `imageFile` state
  2. On submit: if file exists, `fetch("/api/upload", FormData)` first
  3. Gets back `imageUrl` → included in create payload
- **Comma-separated links:** splits `externalLink` and `pdfs` strings into arrays before sending

#### `EditableList.jsx`
- Reusable component for coordinator link/PDF management
- Props: `items`, `onUpdate`, `onAdd`, `onDelete`, `type`
- Local `editValues` state synced with `items` prop via useEffect
- **Save on blur:** when user edits a field and tabs away, if value changed → calls `onUpdate(idx, value)`
- Add row: text field + Add button
- Delete: trash icon per row

---

## 6. Database Design & Relationships

### 6.1 Collections in MongoDB (Compass)

After using the app you'll see:
- **`users`** — one document per registered user
- **`challenges`** — one document per wellness challenge

Database name comes from your `MONGO_URI` (e.g. `urfit` in `mongodb://127.0.0.1:27017/urfit`).

### 6.2 Why data exists in two places

```
User.joinedChallenges  ←→  Challenge.participants
```

**Reason:** Different queries need different access patterns:
- "Show my joined challenges" → read from User (fast with populate)
- "Show participant count on card" → read `participantCount` on Challenge (no count query)
- "Who is enrolled?" on enrollment page → read Challenge.participants

**Cost:** Must update both sides on join/enroll/delete.

### 6.3 Join operation (step by step)

```
Participant clicks Join
    ↓
POST /api/challenges/:id/join  (JWT identifies user)
    ↓
challenge.participants.push(userId)
challenge.participantCount = participants.length
challenge.save()
    ↓
User.findByIdAndUpdate(userId, { $addToSet: { joinedChallenges: challengeId } })
```

### 6.4 Delete operation (cleanup)

```
Coordinator deletes challenge
    ↓
Challenge.findByIdAndDelete(id)
    ↓
User.updateMany(
  { joinedChallenges: id },
  { $pull: { joinedChallenges: id } }
)
```

Without cleanup, users would still reference deleted challenges.

---

## 7. API Endpoints Reference

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /signup | No | Register new user |
| POST | /login | No | Login, returns JWT |

### Challenges (`/api/challenges`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | / | Yes | Create challenge |
| GET | / | No* | List all challenges |
| GET | /joined/me | Yes | Current user's joined challenges |
| GET | /:id | No | Single challenge |
| POST | /:id/join | Yes | Participant self-join |
| POST | /enroll | Yes | Coordinator enrolls user |
| POST | /:id/link | Yes | Add external link |
| PUT | /:id/links | Yes | Update link by index |
| DELETE | /:id/link | Yes | Delete link by index |
| POST | /:id/pdf | Yes | Add PDF URL |
| PUT | /:id/pdf | Yes | Update PDF by index |
| DELETE | /:id/pdf | Yes | Delete PDF by index |
| PUT | /:id/edit | Yes | Edit challenge fields |
| DELETE | /:id | Yes | Delete challenge |

*Client sends token anyway for consistency.

### Users (`/api/users`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | No** | List participants |

**Should be protected — note as improvement.

### Upload (`/api/upload`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | / | No*** | Upload image file |

***Should require auth in production.

---

## 8. Technical Difficulties & How You Solved Them

Use these as stories during the review. They show real debugging, not just AI output.

---

### Story 1: Date timezone off-by-one bug

**Symptom:** Challenge start date showed as the day before what the user selected.

**Root cause:** JavaScript `new Date("2026-06-15")` parses as **UTC midnight**. In US timezones (e.g. EST = UTC-5), that displays as June 14 locally.

**Fix:** `parseLocalDate()` function used on both client and server:
```javascript
const [year, month, day] = datePart.split('-').map(Number)
return new Date(year, month - 1, day)  // local midnight
```

**Files affected:** challengeController.js, ChallengeCard.jsx, ChallengeDetails.jsx, CoordinatorManageChallenge.jsx, ChallengeModal.jsx

**What to say:** "I noticed dates were wrong in the UI, traced it to UTC parsing, and applied a consistent local-date parser on frontend and backend."

---

### Story 2: Express route `/joined/me` returning wrong data

**Symptom:** "My Challenges" tab empty or 404 errors.

**Root cause:** Route `GET /:id` was registered before `GET /joined/me`. Express matched `"joined"` as an ID parameter.

**Fix:** Move specific routes before parameterized routes:
```javascript
router.get("/joined/me", auth, getUserJoinedChallenges)  // first
router.get("/:id", getChallengeById)                        // second
```

**What to say:** "Express matches routes in order. I learned that static paths must come before dynamic `:id` routes."

---

### Story 3: Keeping User and Challenge in sync

**Symptom:** User joined a challenge but "My Challenges" didn't update, or participant count was wrong.

**Root cause:** Only updating one side of the relationship.

**Fix:**
- On join: update both `Challenge.participants` AND `User.joinedChallenges`
- Use `$addToSet` instead of `$push` to prevent duplicate entries
- On delete: `$pull` challenge ID from all users

**What to say:** "I modeled a many-to-many relationship with references on both sides and made sure every join and delete operation updates both documents."

---

### Story 4: Frontend/backend port mismatch

**Symptom:** API calls failed, network errors in browser console.

**Root cause:** Server default port is 5000 (`process.env.PORT || 5000`) but frontend hardcodes 3002 in api.js.

**Fix:** Set `PORT=3002` in `server/.env`.

**What to say:** "The frontend and backend ports must match. I configured PORT in .env to align with the Axios base URL."

---

### Story 5: Image upload and serving

**Symptom:** Challenge created but image broken / 404.

**Root cause:** Multiple pieces must work together:
1. `server/public/` folder must exist
2. Multer saves file there
3. Express serves `/public` as static
4. Vite proxies `/public` in dev
5. Challenge stores URL like `/public/filename.jpg`

**Fix:** Ensured public folder exists, wired static middleware, used Vite proxy for dev.

**What to say:** "Image upload uses multer for storage and Express static middleware for serving. In development, Vite proxies those requests to the backend."

---

### Story 6: Duplicate email with different casing

**Symptom:** Could register same email twice with different capital letters.

**Fix:** `email.toLowerCase()` on both signup and login before database operations.

---

### Story 7: Index-based array editing for links/PDFs

**Challenge:** Challenges have dynamic lists of links and PDFs — not a fixed schema.

**Approach:** Store as string arrays in MongoDB. Update/delete by array index. Frontend `EditableList` saves on blur.

**Tradeoff:** If two users edit simultaneously, indexes could conflict. Fine for this scope; production might use subdocuments with `_id` per item.

---

### Story 8: Mixed API URL patterns in api.js

**Observation:** Most calls use `http://localhost:3002/api`. Edit/delete use relative `/api/...`.

**Why it still works:** Vite dev proxy forwards `/api` to port 3002.

**Improvement:** Use environment variable `VITE_API_URL` for all calls.

---

## 9. Live Demo Script (Step-by-Step)

Run through this with your professor. ~10–15 minutes.

### Before the meeting
- [ ] MongoDB service running (Compass can connect)
- [ ] `server/.env` in place with PORT, MONGO_URI, JWT_SECRET
- [ ] `server/public/` folder exists
- [ ] Terminal 1: `cd server && npm run dev` → see "MongoDB connected" + "port 3002"
- [ ] Terminal 2: `cd client && npm run dev` → open http://localhost:5173
- [ ] Optional: Compass open on `urfit` database

---

### Demo Part A — Coordinator flow (5 min)

**Step 1: Sign up as coordinator**
1. Go to `/signup`
2. Fill name, email, password
3. Select **Coordinator** role
4. Submit → redirected to login

**Say:** "Signup hashes the password with bcrypt and stores the role in MongoDB."

**Step 2: Log in**
1. Enter same credentials
2. Redirected to `/coordinator-challenges`

**Say:** "Login returns a JWT. I store it in localStorage and decode the role to route coordinators here."

**Step 3: Create a challenge**
1. Click "Create New Challenge"
2. Fill title, descriptions, dates (today + future end date)
3. Upload an image
4. Add comma-separated links and PDF URLs
5. Submit

**Say:** "Image uploads through multer to server/public. The returned URL is saved on the challenge document."

**Step 4: Show in Compass (optional)**
1. Refresh Compass → `challenges` collection
2. Point out: title, dates, imageUrl, participants array (empty), externalLink array

**Step 5: Edit challenge**
1. Click "Edit Challenge" on a card
2. Change a link using EditableList
3. Show edit mode for title/description

---

### Demo Part B — Participant flow (5 min)

**Step 6: Sign up as participant**
1. Open incognito window OR logout first
2. Sign up with different email, role **Participant**
3. Login → lands on `/challenges`

**Step 7: Browse and join**
1. Show All Challenges tab
2. Toggle Detailed View
3. Click Join on a challenge
4. Switch to My Challenges tab — challenge appears
5. Open challenge detail page

**Say:** "Join updates both the challenge's participants array and the user's joinedChallenges. That's why it shows in My Challenges."

**Step 8: Show Compass again**
1. `users` collection → participant doc has `joinedChallenges` array with challenge ID
2. `challenges` collection → `participants` array has user ID, `participantCount` incremented

---

### Demo Part C — Coordinator enrollment (3 min)

**Step 9: Coordinator enrolls another user**
1. Log back in as coordinator
2. Go to Enrollment in navbar
3. Select challenge from dropdown
4. Find a participant → click Enroll
5. Status changes to "Enrolled"

**Say:** "Coordinators can manually enroll users. Server checks req.user.role === coordinator before allowing this."

**Step 10: Delete challenge (optional)**
1. Go to manage challenge page
2. Delete → confirm dialog
3. Show in Compass: challenge gone, user's joinedChallenges cleaned up

---

### Demo Part D — Auth proof points (2 min)

**Step 11: Show JWT in browser**
1. F12 → Application → Local Storage → `token`
2. Or console: `localStorage.getItem('token')`
3. Paste token into jwt.io (optional) — show payload has userId, role, exp

**Step 12: Show protected route rejection**
1. Clear localStorage token
2. Try to visit `/challenges` directly → redirected to login

**Say:** "Frontend redirect is UX. The API also rejects requests without a valid Bearer token."

---

## 10. Professor Q&A — Prepared Answers

### "Walk me through authentication."

> Signup normalizes email, checks duplicates, bcrypt-hashes the password, saves to MongoDB. Login compares the hash, then signs a JWT with userId, name, email, and role using JWT_SECRET with a 2-hour expiry. The frontend stores the token in localStorage and sends it as Authorization Bearer on protected requests. Server middleware verifies the token and attaches req.user before controllers run.

### "Why JWT instead of sessions?"

> JWT is stateless — the server doesn't need to store session data. The token carries the user identity and role. Good fit for a REST API where the React frontend and Express backend are separate.

### "Is storing JWT in localStorage secure?"

> For a class project it's acceptable. The main risk is XSS stealing the token. Production apps often use httpOnly cookies. Passwords are never stored plain text — only bcrypt hashes. Tokens expire in 2 hours.

### "How do you enforce coordinator vs participant?"

> Three layers: (1) JWT payload includes role. (2) Frontend redirects wrong roles away from pages. (3) Server checks role in sensitive operations like userEnrollment — returns 403 if not coordinator. Layer 3 is the real security.

### "Explain your database schema."

> Two main collections. Users have credentials, role, and joinedChallenges references. Challenges have content, dates, participants references, and resource arrays. I use Mongoose populate to join related data when fetching.

### "Why participantCount if you have participants array?"

> Denormalization for display performance — cards show the count without counting the array every time. I update it whenever someone joins.

### "What happens when you delete a challenge?"

> Delete the challenge document, then run updateMany on all users to $pull that challenge ID from joinedChallenges so no stale references remain.

### "What was the hardest bug?"

> (Pick Story 1 or 2 above — dates or route ordering — both show real debugging.)

### "What would you improve?"

> See Section 11 — shows self-awareness.

---

## 11. Known Limitations (Honest Improvements)

Voluntarily mentioning these shows you understand the code beyond "it works."

| Limitation | Improvement |
|------------|-------------|
| No auth on `GET /api/users` | Add auth middleware + coordinator role check |
| No auth on image upload | Require JWT for POST /api/upload |
| `createChallenge` doesn't verify coordinator role on server | Add role check like userEnrollment |
| JWT in localStorage | httpOnly cookies + refresh tokens in production |
| No global AuthContext | React Context or custom `useAuth()` hook |
| Mixed API URLs in api.js | Single `VITE_API_URL` env variable |
| Index-based link/PDF edits | Subdocuments with unique IDs |
| No input sanitization for URLs | Validate URL format server-side |
| No pagination | Add limit/skip for large challenge lists |
| Email/password validation minimal | Stronger validation, email verification |

**What to say:** "These are conscious tradeoffs for scope and timeline. I know where I'd harden it for production."

---

## 12. Quick File Index

### Server
| File | One-line purpose |
|------|------------------|
| server.js | Express app entry, middleware, route mounting |
| config/db.js | Mongoose MongoDB connection |
| models/User.js | User schema |
| models/Challenge.js | Challenge schema |
| controllers/authController.js | Signup, login, list participants |
| controllers/challengeController.js | All challenge CRUD + join/enroll |
| middleware/auth.js | JWT verification |
| routes/authRoutes.js | /signup, /login |
| routes/challengeRoutes.js | All /challenges endpoints |
| routes/userRoutes.js | GET users |
| routes/uploadImageRoutes.js | Multer image upload |
| package.json | Dependencies and scripts |

### Client
| File | One-line purpose |
|------|------------------|
| index.html | HTML shell |
| main.jsx | React mount + ThemeProvider |
| App.jsx | Route definitions |
| vite.config.js | Dev server + API proxy |
| theme.js | MUI theme |
| services/api.js | All HTTP calls |
| components/auth/login.jsx | Login page |
| components/auth/signup.jsx | Signup page |
| components/Navbar.jsx | Navigation bar |
| components/ChallengeCard.jsx | Compact challenge card |
| components/ExpandedChallengeCard.jsx | Detailed challenge card |
| components/ChallengeModal.jsx | Create challenge dialog |
| components/EditableList.jsx | Edit links/PDFs inline |
| pages/Home.jsx | Landing page |
| pages/Challenges.jsx | Participant dashboard |
| pages/CoordinatorChallenges.jsx | Coordinator dashboard |
| pages/ChallengeDetails.jsx | Participant challenge view |
| pages/CoordinatorManageChallenge.jsx | Coordinator edit view |
| pages/EnrollUser.jsx | Manual enrollment table |

---

## Appendix A — Auth Flow Diagram

```
SIGNUP                          LOGIN                         PROTECTED REQUEST
──────                          ─────                         ─────────────────

signup.jsx                      login.jsx                     any protected page
    │                               │                              │
    ▼                               ▼                              ▼
api.signup()                    api.login()                   api.*(token)
    │                               │                              │
    ▼                               ▼                              ▼
POST /api/auth/signup           POST /api/auth/login          GET/POST /api/...
    │                               │                         Authorization: Bearer xxx
    ▼                               ▼                              │
authController.signup           authController.login               ▼
    │                               │                         middleware/auth.js
    ├─ lowercase email              ├─ find user                     │
    ├─ check duplicate              ├─ bcrypt.compare                ├─ verify JWT
    ├─ bcrypt.hash                  ├─ jwt.sign                      ├─ req.user = decoded
    └─ User.save()                  └─ return token                  └─ next() → controller
                                        │
                                        ▼
                                  localStorage.setItem("token")
                                        │
                                        ▼
                                  jwtDecode → role-based navigate
```

---

## Appendix B — Role-Based Page Access

| Page | participant | coordinator | guest |
|------|:-----------:|:-----------:|:-----:|
| Home | ✓ | ✓ | ✓ |
| Login/Signup | ✓ | ✓ | ✓ |
| /challenges | ✓ | → redirect | → login |
| /coordinator-challenges | → redirect | ✓ | → login |
| /challenges/:id | ✓ | → login | → login |
| /coordinator/challenges/:id | → login | ✓ | → login |
| /enrollment | → login | ✓ | → login |

---

## Appendix C — Environment & Setup Checklist

```
[ ] Node.js installed (node -v)
[ ] MongoDB Community Server running
[ ] Compass connects to mongodb://127.0.0.1:27017
[ ] server/.env exists with PORT=3002, MONGO_URI, JWT_SECRET
[ ] server/public/ folder exists
[ ] cd server && npm install && npm run dev
[ ] cd client && npm install && npm run dev
[ ] Browser: http://localhost:5173
[ ] Server logs: "MongoDB connected" + "Server running on port 3002"
```

---

*Good luck with your review session. You built a full-stack app with real auth, role separation, file uploads, and relational data in MongoDB — that's solid work to defend.*
