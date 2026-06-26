import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Signup from "./components/auth/signup"
import Login from "./components/auth/login"
import Home from "./pages/Home"
import Challenges from "./pages/Challenges"
import CoordinatorChallenges from "./pages/CoordinatorChallenges"
import ChallengeDetails from "./pages/ChallengeDetails"
import CoordinatorManageChallenge from "./pages/CoordinatorManageChallenge"
import EnrollUser from "./pages/EnrollUser"

/**
 * App.jsx
 * -------
 * Main entry point for the UR Fit.
 */

const App = () => {
  return (
    // Set up the router for client-side navigation
    <Router>
      <Routes>
        {/* Home/Landing page */}
        <Route path="/" element={<Home />} />
        {/* Signup page */}
        <Route path="/signup" element={<Signup />} />
        {/* Login page */}
        <Route path="/login" element={<Login />} />
        {/* Participant: All challenges and joined challenges */}
        <Route path="/challenges" element={<Challenges />} />
        {/* Coordinator: Dashboard for managing all challenges */}
        <Route
          path="/coordinator-challenges"
          element={<CoordinatorChallenges />}
        />
        {/* Participant: Challenge details page */}
        <Route path="/challenges/:id" element={<ChallengeDetails />} />
        {/* Coordinator: Manage/edit a specific challenge */}
        <Route
          path="/coordinator/challenges/:id"
          element={<CoordinatorManageChallenge />}
        />
        {/* Coordinator: Enroll users in challenges */}
        <Route path="/enrollment" element={<EnrollUser />} />
      </Routes>
    </Router>
  )
}

export default App
