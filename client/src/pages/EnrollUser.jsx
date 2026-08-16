import React, { useEffect, useState } from "react"
import { jwtDecode } from "jwt-decode"
import { useNavigate } from "react-router-dom"
import {
  Button,
  TextField,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Snackbar,
  Container,
  Typography,
  Box,
} from "@mui/material"
import MuiAlert from "@mui/material/Alert"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import {
  getAllUsers,
  getAllChallenges,
  inviteUser,
  getChallengeById,
} from "../services/api"
import Navbar from "../components/Navbar"

/**
 * EnrollUser Page
 * ---------------
 * Allows coordinators to enroll users into challenges.
 */

const EnrollUser = () => {
  // State for users, challenges, selected challenge, enrolled users, search, and snackbar
  const [users, setUsers] = useState([])
  const [challenges, setChallenges] = useState([])
  const [selectedChallenge, setSelectedChallenge] = useState("")
  const [enrolledUserIds, setEnrolledUserIds] = useState([])
  const [invitationStatus, setInvitationStatus] = useState({})
  const [search, setSearch] = useState("")
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  })

  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  let user = null

  // Decode user from JWT token if available
  try {
    if (token) user = jwtDecode(token)
  } catch {
    user = null
  }

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  // Redirect to login if not authenticated or not a coordinator
  useEffect(() => {
    if (!token) {
      navigate("/login")
      return
    }
    try {
      const decoded = jwtDecode(token)
      if (decoded.role !== "coordinator") {
        navigate("/login")
        return
      }
    } catch {
      navigate("/login")
      return
    }
  }, [token, navigate])

  // Fetch all users and challenges on mount
  useEffect(() => {
    if (!token) return
    getAllUsers(token)
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]))
    getAllChallenges(token)
      .then((res) => setChallenges(res.data))
      .catch(() => setChallenges([]))
  }, [token])

  // Fetch enrolled user IDs when selected challenge changes
  useEffect(() => {
    if (selectedChallenge) {
      let mounted = true
      const fetchData = () =>
        getChallengeById(selectedChallenge, token)
          .then((challenge) => {
            if (!mounted) return
            const ids = Array.isArray(challenge.participants)
              ? challenge.participants.map((u) =>
                  typeof u === "string" ? u : String(u._id)
                )
              : []
            setEnrolledUserIds(ids)

            const invMap = {}
            if (Array.isArray(challenge.invitations)) {
              challenge.invitations.forEach((i) => {
                invMap[String(i.user)] = i.status
              })
            }
            setInvitationStatus(invMap)
          })
          .catch(() => setEnrolledUserIds([]))

      fetchData()
      const iv = setInterval(fetchData, 5000)
      return () => {
        mounted = false
        clearInterval(iv)
      }
    } else {
      setEnrolledUserIds([])
    }
  }, [selectedChallenge, token])

  // Handle inviting a user in the selected challenge
  const handleInvite = (userId) => {
    if (!selectedChallenge) {
      setSnackbar({
        open: true,
        message: "Please select a challenge first.",
        severity: "error",
      })
      return
    }
      inviteUser(selectedChallenge, userId, token)
      .then((res) => {
        setSnackbar({
          open: true,
          message: res.data.message || "Invitation sent!",
          severity: "success",
        })
        // Refresh challenge data
        return getChallengeById(selectedChallenge, token)
      })
      .then((challenge) => {
        const ids = Array.isArray(challenge.participants)
          ? challenge.participants.map((u) => (typeof u === "string" ? u : String(u._id)))
          : []
        setEnrolledUserIds(ids)

        const invMap = {}
        if (Array.isArray(challenge.invitations)) {
          challenge.invitations.forEach((i) => {
            invMap[String(i.user)] = i.status
          })
        }
        setInvitationStatus(invMap)
      })
      .catch((err) =>
        setSnackbar({
          open: true,
          message: err.response?.data?.message || "Invite failed.",
          severity: "error",
        })
      )
  }

  const handleCancelInvite = (userId) => {}

  // Filter users by search input
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Top navigation bar */}
      <Navbar user={user} onLogout={handleLogout} />
      {/* Back button */}
      <Box sx={{ pl: 2, pt: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{
            color: "#000",
            textTransform: "none",
            fontSize: "16px",
            fontWeight: 500,
            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.05)" },
          }}
        >
          Back
        </Button>
      </Box>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Page title */}
        <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
          Invite Users
        </Typography>
        {/* Search bar and challenge select dropdown */}
        <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
          <TextField
            label="Search users"
            variant="outlined"
            value={search}
            color="black"
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 300 }}
          />
          <Select
            value={selectedChallenge}
            onChange={(e) => setSelectedChallenge(e.target.value)}
            displayEmpty
            color="black"
            variant="outlined"
            sx={{ minWidth: 300 }}
          >
            <MenuItem value="">
              <em>Select a challenge</em>
            </MenuItem>
            {challenges.map((challenge) => (
              <MenuItem key={challenge._id} value={challenge._id}>
                {challenge.title}
              </MenuItem>
            ))}
          </Select>
        </Box>
        {/* Users table */}
        <Table
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {invitationStatus[String(user._id)] ? (
                    invitationStatus[String(user._id)] === "pending" ? (
                      <span style={{ color: "#f57c00" }}>Pending</span>
                    ) : invitationStatus[String(user._id)] === "accepted" ? (
                      <span style={{ color: "#1976d2" }}>Accepted</span>
                    ) : invitationStatus[String(user._id)] === "rejected" ? (
                      <span style={{ color: "#9e9e9e" }}>Rejected</span>
                    ) : (
                      <span style={{ textTransform: "capitalize" }}>{invitationStatus[String(user._id)]}</span>
                    )
                  ) : enrolledUserIds.includes(String(user._id)) ? (
                    <span style={{ color: "#4caf50" }}>Enrolled</span>
                  ) : (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleInvite(user._id)}
                      sx={{
                        backgroundColor: "#000",
                        color: "#fff",
                        textTransform: "none",
                        "&:hover": { backgroundColor: "#333" },
                      }}
                    >
                      Invite
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

export default EnrollUser
