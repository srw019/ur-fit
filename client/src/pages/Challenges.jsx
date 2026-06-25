import React, { useEffect, useState } from "react"
import { jwtDecode } from "jwt-decode"
import { useNavigate } from "react-router-dom"
import { CircularProgress, Container, Tabs, Tab } from "@mui/material"
import Navbar from "../components/Navbar"
import {
  getAllChallenges,
  getJoinedChallenges,
  joinChallenge,
} from "../services/api"
import ChallengeCard from "../components/ChallengeCard"
import ExpandedChallengeCard from "../components/ExpandedChallengeCard"
import Snackbar from "@mui/material/Snackbar"
import MuiAlert from "@mui/material/Alert"

/**
 * Challenges Page
 * ---------------
 * Displays all wellness challenges and the user's joined challenges.
 */

const Challenges = () => {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  // State for all challenges and joined challenges
  const [allChallenges, setAllChallenges] = useState([])
  const [joinedChallenges, setJoinedChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  // Toggle between card and expanded (detailed) view
  const [useExpandedView, setUseExpandedView] = useState(false)
  // Search input state
  const [search, setSearch] = useState("")
  // Tab state: 0 = All Challenges, 1 = My Challenges (with persistence)
  const [tab, setTab] = useState(() => {
    const savedTab = localStorage.getItem("challengesTab")
    return savedTab !== null ? Number(savedTab) : 0
  })
  // Snackbar state for feedback messages
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  })

  // Decode user from JWT token if available
  let user = null
  try {
    if (token) user = jwtDecode(token)
  } catch {
    user = null
  }

  // Fetch all challenges from API
  const fetchAll = async () => {
    setLoading(true)
    const res = await getAllChallenges(token)
    setAllChallenges(res.data)
    setLoading(false)
  }

  // Fetch joined challenges from API
  const fetchJoined = async () => {
    setLoading(true)
    const res = await getJoinedChallenges(token)
    setJoinedChallenges(res.data)
    setLoading(false)
  }

  // Filter all challenges by search input
  const filteredAllChallenges = allChallenges.filter(
    (challenge) =>
      challenge.title.toLowerCase().includes(search.toLowerCase()) ||
      (challenge.description &&
        challenge.description.toLowerCase().includes(search.toLowerCase()))
  )

  // Filter joined challenges by search input
  const filteredJoinedChallenges = joinedChallenges.filter(
    (challenge) =>
      challenge.title.toLowerCase().includes(search.toLowerCase()) ||
      (challenge.description &&
        challenge.description.toLowerCase().includes(search.toLowerCase()))
  )

  // On mount: check auth, redirect if needed, and fetch data
  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }
    if (user.role === "coordinator") {
      navigate("/coordinator-challenges")
      return
    }
    fetchAll()
    fetchJoined()
  }, [])

  // Handle joining a challenge
  const handleJoin = async (challengeId) => {
    await joinChallenge(challengeId, token)
    setSnackbar({
      open: true,
      message: "Successfully joined the challenge!",
      severity: "success",
    })
    fetchAll()
    fetchJoined()
  }

  // Handle tab change and persist selected tab
  const handleTabChange = (_, v) => {
    setTab(v)
    localStorage.setItem("challengesTab", v)
  }

  // Check if a challenge is already joined
  const isJoined = (challengeId) =>
    joinedChallenges.some((c) => c._id === challengeId)

  if (!user) return null

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9f9f9" }}>
      {/* Top navigation bar */}
      <Navbar
        user={user}
        onLogout={() => {
          localStorage.removeItem("token")
          navigate("/login")
        }}
      />

      <Container maxWidth="lg" style={{ padding: "2px 0" }}>
        {/* Page title and welcome message */}
        <h1
          style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "2px" }}
        >
          Wellness Challenges
        </h1>
        <p style={{ fontSize: "16px", color: "#666" }}>
          Welcome to UR Fit, {user?.name || "User"}!
        </p>
        {/* Search bar and view toggle button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Search challenges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              width: "300px",
              marginRight: "16px",
            }}
          />

          <button
            onClick={() => setUseExpandedView(!useExpandedView)}
            style={{
              padding: "8px 16px",
              background: "#000",
              color: "#fff",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              height: "40px",
            }}
          >
            {useExpandedView ? "Card View" : "Detailed View"}
          </button>
        </div>

        {/* Tabs for All Challenges and My Challenges */}
        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="fullWidth"
          TabIndicatorProps={{
            style: { backgroundColor: "#000", height: 1.5 },
          }}
          sx={{
            marginBottom: "24px",
            minHeight: 0,
            "& .MuiTab-root": {
              minHeight: 0,
              fontSize: "16px",
              fontWeight: "normal",
              color: "#666",
            },
            "& .Mui-selected": {
              color: "#000 !important",
            },
          }}
        >
          <Tab
            label="All Challenges"
            style={{
              fontSize: "16px",
            }}
          />
          <Tab
            label="My Challenges"
            style={{
              fontSize: "16px",
            }}
          />
        </Tabs>

        {/* Loading spinner */}
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "80px 0",
            }}
          >
            <CircularProgress size={60} />
          </div>
        ) : (
          // Challenges grid
          <div
            style={{
              display: "grid",
              gap: "24px",
              gridTemplateColumns: useExpandedView
                ? "1fr"
                : "repeat(auto-fill, minmax(300px, 1fr))",
            }}
          >
            {/* All Challenges tab */}
            {tab === 0 ? (
              filteredAllChallenges.length === 0 ? (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: "48px 0",
                  }}
                >
                  <p style={{ fontSize: "18px", color: "#666" }}>
                    No challenges available
                  </p>
                </div>
              ) : (
                // Show all challenges, including joined ones
                filteredAllChallenges.map((challenge) =>
                  useExpandedView ? (
                    <ExpandedChallengeCard
                      key={challenge._id}
                      challenge={challenge}
                      isJoined={isJoined(challenge._id)}
                      onJoin={handleJoin}
                    />
                  ) : (
                    <ChallengeCard
                      key={challenge._id}
                      challenge={challenge}
                      isJoined={isJoined(challenge._id)}
                      onJoin={handleJoin}
                    />
                  )
                )
              )
            ) : filteredJoinedChallenges.length === 0 ? (
              // My Challenges tab, but no joined challenges
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "48px 0",
                }}
              >
                <p style={{ fontSize: "18px", color: "#666" }}>
                  No joined challenges
                </p>
              </div>
            ) : (
              // Show joined challenges
              filteredJoinedChallenges.map((challenge) =>
                useExpandedView ? (
                  <ExpandedChallengeCard
                    key={challenge._id}
                    challenge={challenge}
                    isJoined={true}
                    onJoin={handleJoin}
                  />
                ) : (
                  <ChallengeCard
                    key={challenge._id}
                    challenge={challenge}
                    isJoined={true}
                    onJoin={handleJoin}
                  />
                )
              )
            )}
          </div>
        )}
      </Container>
      {/* Snackbar for feedback messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </div>
  )
}

export default Challenges
