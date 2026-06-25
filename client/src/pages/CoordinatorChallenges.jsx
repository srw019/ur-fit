import React, { useEffect, useState } from "react"
import { jwtDecode } from "jwt-decode"
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Container,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { getAllChallenges, createChallenge } from "../services/api"
import ChallengeModal from "../components/ChallengeModal"
import ChallengeCard from "../components/ChallengeCard"

/**
 * CoordinatorChallenges Page
 * --------------------------
 * Displays the dashboard for coordinators to manage wellness challenges.
 */

const CoordinatorChallenges = () => {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  let user = null

  // Decode user from JWT token if available
  try {
    if (token) user = jwtDecode(token)
  } catch {
    user = null
  }

  // State for challenges, loading, modal, and search input
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState("")

  // On mount: check auth, redirect if needed, and fetch challenges
  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }
    if (user.role !== "coordinator") {
      navigate("/challenges")
      return
    }
    fetchChallenges()
  }, [])

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  // Fetch all challenges from API
  const fetchChallenges = async () => {
    setLoading(true)
    const res = await getAllChallenges(token)
    setChallenges(res.data)
    setLoading(false)
  }

  // Filter challenges by search input
  const filteredChallenges = challenges.filter(
    (challenge) =>
      challenge.title.toLowerCase().includes(search.toLowerCase()) ||
      (challenge.description &&
        challenge.description.toLowerCase().includes(search.toLowerCase()))
  )

  // Handle creation of a new challenge
  const handleCreateChallenge = async (challengeData) => {
    try {
      const response = await createChallenge(challengeData, token)
      setModalOpen(false)
      fetchChallenges()
    } catch (error) {
      console.error("Error creating challenge:", error.response?.data || error.message)
      alert(
        "Error creating challenge: " +
          (error.response?.data?.message || error.message)
      )
    }
  }

  // If not a coordinator, render nothing
  if (!user || user.role !== "coordinator") return null

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9f9f9" }}>
      {/* Top navigation bar */}
      <Navbar user={user} onLogout={handleLogout} />
      <Container maxWidth="lg" style={{ padding: "32px 0" }}>
        {/* Page title */}
        <Typography
          variant="h4"
          style={{ fontWeight: "bold", marginBottom: "16px" }}
        >
          Coordinator Dashboard
        </Typography>
        {/* Search bar and Create Challenge button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
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
          <Button
            variant="contained"
            onClick={() => setModalOpen(true)}
            style={{ backgroundColor: "#000" }}
          >
            Create New Challenge
          </Button>
        </div>

        {/* Loading spinner, empty state, or challenges grid */}
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
        ) : filteredChallenges.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Typography style={{ color: "#666" }}>
              No challenges created yet
            </Typography>
          </div>
        ) : (
          // Challenges grid
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge._id}
                challenge={challenge}
                isCoordinator={true}
                onJoin={() => {}}
                isJoined={false}
                userRole={user.role}
              />
            ))}
          </div>
        )}

        {/* Modal for creating a new challenge */}
        <ChallengeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreate={handleCreateChallenge}
        />
      </Container>
    </div>
  )
}

export default CoordinatorChallenges
