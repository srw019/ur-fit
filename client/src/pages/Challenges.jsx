import React, { useEffect, useState } from "react"
import { jwtDecode } from "jwt-decode"
import { useNavigate } from "react-router-dom"
import { CircularProgress, Container, Tabs, Tab, Box } from "@mui/material"
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

// Browse and join challenges
const Challenges = () => {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  const [allChallenges, setAllChallenges] = useState([])
  const [joinedChallenges, setJoinedChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [useExpandedView, setUseExpandedView] = useState(false)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState(() => {
    const savedTab = localStorage.getItem("challengesTab")
    return savedTab !== null ? Number(savedTab) : 0
  })
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  })

  const isTokenExpired = (tokenToCheck) => {
    if (!tokenToCheck) return true
    try {
      const decodedToken = jwtDecode(tokenToCheck)
      return decodedToken.exp && decodedToken.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }

  // get user from token
  let user = null
  try {
    if (token && !isTokenExpired(token)) user = jwtDecode(token)
  } catch {
    user = null
  }

  // get all challenges
  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await getAllChallenges(token)
      setAllChallenges(res.data)
    } catch (err) {
      console.error("Error fetching all challenges:", err)
      if (err?.response?.status === 401) {
        localStorage.removeItem("token")
        navigate("/login")
        return
      }
    } finally {
      setLoading(false)
    }
  }

  // get joined challenges
  const fetchJoined = async () => {
    setLoading(true)
    try {
      const res = await getJoinedChallenges(token)
      setJoinedChallenges(res.data)
    } catch (err) {
      console.error("Error fetching joined challenges:", err)
      if (err?.response?.status === 401) {
        localStorage.removeItem("token")
        navigate("/login")
        return
      }
    } finally {
      setLoading(false)
    }
  }

  // filter challenges by search
  const filteredAllChallenges = allChallenges.filter(
    (challenge) =>
      challenge.title.toLowerCase().includes(search.toLowerCase()) ||
      (challenge.description &&
        challenge.description.toLowerCase().includes(search.toLowerCase()))
  )

  // filter joined challenges
  const filteredJoinedChallenges = joinedChallenges.filter(
    (challenge) =>
      challenge.title.toLowerCase().includes(search.toLowerCase()) ||
      (challenge.description &&
        challenge.description.toLowerCase().includes(search.toLowerCase()))
  )

  // load challenges on mount
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

  // join challenge
  const handleJoin = async (challengeId) => {
    try {
      await joinChallenge(challengeId, token)
      setSnackbar({
        open: true,
        message: "Successfully joined the challenge!",
        severity: "success",
      })
      fetchAll()
      fetchJoined()
    } catch (err) {
      console.error("Join challenge failed:", err)
      const message =
        err?.response?.data?.message || "Unable to join challenge"
      if (err?.response?.status === 401) {
        localStorage.removeItem("token")
        navigate("/login")
        return
      }
      setSnackbar({
        open: true,
        message,
        severity: "error",
      })
    }
  }

  // handle tab change
  const handleTabChange = (_, v) => {
    setTab(v)
    localStorage.setItem("challengesTab", v)
  }

  // check if already joined
  const isJoined = (challengeId) =>
    joinedChallenges.some((c) => c._id === challengeId)

  if (!user) return null

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9f9f9" }}>
      <Navbar
        user={user}
        onLogout={() => {
          localStorage.removeItem("token")
          navigate("/login")
        }}
      />

      <Container maxWidth="lg" style={{ padding: "2px 0" }}>
        <h1
          style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "2px", textAlign: "center" }}
        >
          Wellness Challenges
        </h1>
        <p style={{ fontSize: "16px", color: "#666", textAlign: "center" }}>Welcome to UR Fit, {user?.name || "User"}!</p>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2, marginBottom: '16px' }}>
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
              width: "100%",
              maxWidth: "300px",
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
        </Box>

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
