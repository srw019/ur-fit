import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import {
  Box,
  Typography,
  Container,
  Divider,
  CircularProgress,
  Button,
  TextField,
  Dialog,
  Chip,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import EmailIcon from "@mui/icons-material/Email"
import IconButton from "@mui/material/IconButton"

import {
  getChallengeById,
  getChallengeLeaderboard,
  updateSingleChallengeLink,
  updateSingleChallengePdf,
  addChallengeLink,
  addChallengePdf,
  deleteSingleChallengeLink,
  deleteSingleChallengePdf,
  editChallenge,
  deleteChallenge,
} from "../services/api"
import EditableList from "../components/EditableList"
import Navbar from "../components/Navbar"

/**
 * CoordinatorManageChallenge Page
 * -------------------------------
 * Allows coordinators to view, edit, and manage a single challenge.
 */

const CoordinatorManageChallenge = () => {
  const { id } = useParams()
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  let user = null
  const [editMode, setEditMode] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  const [editFields, setEditFields] = useState({
    title: "",
    description: "",
    longDescription: "",
    startDate: "",
    endDate: "",
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Helper function to parse YYYY-MM-DD string as local date (not UTC)
  const parseLocalDate = (dateString) => {
    if (!dateString) return null
    // Extract just the date part (YYYY-MM-DD) from ISO string if needed
    const datePart = dateString.split('T')[0]
    const [year, month, day] = datePart.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Helper function to format date to YYYY-MM-DD
  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = parseLocalDate(dateString)
    if (!date) return ""
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Helper function to get YYYY-MM-DD format for input field
  const getDateInputFormat = (dateString) => {
    if (!dateString) return ""
    const date = parseLocalDate(dateString)
    if (!date) return ""
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Decode user from JWT token if available
  try {
    if (token) user = jwtDecode(token)
  } catch {
    user = null
  }

  // When challenge loads, set edit fields for editing
  useEffect(() => {
    if (challenge) {
      setEditFields({
        title: challenge.title || "",
        description: challenge.description || "",
        longDescription: challenge.longDescription || "",
        startDate: getDateInputFormat(challenge.startDate) || "",
        endDate: getDateInputFormat(challenge.endDate) || "",
      })
    }
  }, [challenge])

  // Load starred set from localStorage for this viewer and challenge
  useEffect(() => {
    const viewerId = user?.userId || user?.id || user?._id
    if (!id || !viewerId) return
    try {
      const key = `starred:${id}:${viewerId}`
      const raw = localStorage.getItem(key)
      if (raw) {
        const arr = JSON.parse(raw)
        setStarred(new Set(Array.isArray(arr) ? arr : []))
      }
    } catch (e) {
      // ignore
    }
  }, [id, user])

  const toggleStar = (studentId) => {
    const viewerId = user?.userId || user?.id || user?._id
    if (!viewerId) return
    const key = `starred:${id}:${viewerId}`
    const next = new Set(starred)
    if (next.has(studentId)) next.delete(studentId)
    else next.add(studentId)
    setStarred(next)
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(next)))
    } catch (e) {
      // ignore
    }
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
      }
    } catch {
      navigate("/login")
    }
  }, [token, navigate])

  // Fetch challenge data by ID
  useEffect(() => {
    const fetchChallenge = async () => {
      setLoading(true)
      try {
        const challenge = await getChallengeById(id, token)
        setChallenge(challenge)
      } catch (err) {
        console.error("Error fetching challenge:", err)
        setChallenge(null)
      }
      setLoading(false)
    }
    fetchChallenge()
  }, [id, token])

  const refreshLeaderboard = async () => {
    setLeaderboardLoading(true)
    try {
      const leaderboardResponse = await getChallengeLeaderboard(id, token)
      setLeaderboard(leaderboardResponse.data)
    } catch (leaderboardErr) {
      console.error("Error fetching leaderboard:", leaderboardErr)
      setLeaderboard([])
    }
    setLeaderboardLoading(false)
  }

  useEffect(() => {
    if (challenge) {
      refreshLeaderboard()
    }
  }, [challenge])

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress size={60} />
      </Box>
    )
  }

  // Show error if challenge not found
  if (!challenge) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Typography variant="h6" color="error">
          Challenge not found.
        </Typography>
      </Box>
    )
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9f9f9" }}>
      {/* Top navigation bar */}
      <Navbar user={user} onLogout={handleLogout} />
      {/* Back button */}
      <Box sx={{ pl: 2, pt: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/coordinator-challenges")}
          sx={{
            color: "#000",
            textTransform: "none",
            fontSize: "16px",
            fontWeight: 500,
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.05)",
            },
          }}
        >
          Back
        </Button>
      </Box>
      <Container sx={{ py: 6 }}>
        {/* Top: Image and Details */}
        <Box
          display="grid"
          gridTemplateAreas={`"image details"`}
          gridTemplateColumns="1fr 2fr"
          gap={4}
          alignItems="center"
        >
          {/* Challenge image */}
          <Box gridArea="image" display="flex" justifyContent="center">
            {challenge.imageUrl && (
              <img
                src={challenge.imageUrl}
                alt={challenge.title}
                style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 8 }}
              />
            )}
          </Box>

          {/* Challenge details and edit mode */}
          <Box gridArea="details">
            {editMode ? (
              <>
                {/* Edit fields for title, description, long description */}
                <TextField
                  label="Title"
                  value={editFields.title}
                  onChange={(e) =>
                    setEditFields({ ...editFields, title: e.target.value })
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Description"
                  value={editFields.description}
                  onChange={(e) =>
                    setEditFields({
                      ...editFields,
                      description: e.target.value,
                    })
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Long Description"
                  value={editFields.longDescription}
                  onChange={(e) =>
                    setEditFields({
                      ...editFields,
                      longDescription: e.target.value,
                    })
                  }
                  fullWidth
                  multiline
                  minRows={3}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Start Date"
                  type="date"
                  value={editFields.startDate}
                  onChange={(e) =>
                    setEditFields({
                      ...editFields,
                      startDate: e.target.value,
                    })
                  }
                  fullWidth
                  inputProps={{
                    min: getTodayDate(),
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={editFields.endDate}
                  onChange={(e) =>
                    setEditFields({
                      ...editFields,
                      endDate: e.target.value,
                    })
                  }
                  fullWidth
                  inputProps={{
                    min: editFields.startDate || getTodayDate(),
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
                {/* Save and Cancel buttons */}
                <Button
                  variant="contained"
                  sx={{ mr: 2, backgroundColor: "#000" }}
                  onClick={async () => {
                    try {
                      await editChallenge(challenge._id, editFields, token)
                      setEditMode(false)
                      const updated = await getChallengeById(
                        challenge._id,
                        token
                      )
                      setChallenge(updated)
                    } catch (err) {
                      // handle error
                    }
                  }}
                >
                  Save
                </Button>
                <Button variant="outlined" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {/* Challenge title, description, long description */}
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {challenge.title}
                </Typography>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  gutterBottom
                >
                  {challenge.description}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {challenge.longDescription}
                </Typography>
                {/* Chips for dates and participant count */}
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={`Starts: ${formatDate(challenge.startDate)}`}
                    sx={{ mr: 2 }}
                  />
                  <Chip
                    label={`Ends: ${formatDate(challenge.endDate)}`}
                    sx={{ mr: 2 }}
                  />
                  <Chip label={`${challenge.participantCount} Participants`} />
                </Box>
                <Divider />
                {/* Edit and Delete buttons */}
                <Button
                  variant="outlined"
                  sx={{ mt: 2 }}
                  color="black"
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  sx={{
                    mt: 2,
                    ml: 2,
                    borderColor: "#d32f2f",
                    color: "#d32f2f",
                  }}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete
                </Button>
              </>
            )}
          </Box>
        </Box>
        <Box mt={4}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Challenge Leaderboard
          </Typography>
          {leaderboardLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading leaderboard...
            </Typography>
          ) : leaderboard.length > 0 ? (
            <Box
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr 1fr 120px",
                  backgroundColor: "#f5f5f5",
                  px: 2,
                  py: 1,
                  fontWeight: 700,
                }}
              >
                <Typography>Rank</Typography>
                <Typography>Name</Typography>
                <Typography>Email</Typography>
                <Typography>Points</Typography>
              </Box>
              {leaderboard.map((entry) => (
                <Box
                  key={entry.student._id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "64px 1fr 1fr 120px",
                    px: 2,
                    py: 1,
                    backgroundColor: "#fff",
                  }}
                >
                  <Typography>{entry.rank}</Typography>
                  <Typography>{entry.student.name || "Unknown"}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {entry.student.email ? (
                      (() => {
                        const email = entry.student.email
                        const subject = `Congrats on your rank in ${challenge.title}`
                        const body = `Hi ${entry.student.name || ''},\n\nCongratulations on finishing #${entry.rank} in \"${challenge.title}\".\n\nBest regards,\n${user?.name || ''}`
                        const href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                        return (
                          <>
                            <Typography component="a" href={href} sx={{ color: 'text.secondary', textDecoration: 'none' }}>
                              {email}
                            </Typography>
                            <IconButton aria-label={`email-${entry.student._id}`} href={href} size="small">
                              <EmailIcon fontSize="small" />
                            </IconButton>
                          </>
                        )
                      })()
                    ) : (
                      <Typography sx={{ color: "text.secondary" }}>-</Typography>
                    )}
                  </Box>
                  <Typography>{entry.totalPoints}</Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No leaderboard entries yet.
            </Typography>
          )}
        </Box>
        {/* Bottom: Editable lists for links and PDFs */}
        <Box
          display="grid"
          gridTemplateColumns="1fr 1fr"
          gridTemplateAreas={`"links pdfs"`}
          gap={4}
          mt={4}
        >
          {/* External Links editable list */}
          <Box gridArea="links">
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              External Links
            </Typography>
            <EditableList
              items={challenge.externalLink || []}
              onUpdate={async (idx, value) => {
                await updateSingleChallengeLink(id, idx, value, token)
                const updated = await getChallengeById(id, token)
                setChallenge(updated)
              }}
              onAdd={async (value) => {
                await addChallengeLink(id, value, token)
                const updated = await getChallengeById(id, token)
                setChallenge(updated)
              }}
              onDelete={async (idx) => {
                await deleteSingleChallengeLink(id, idx, token)
                const updated = await getChallengeById(id, token)
                setChallenge(updated)
              }}
              label=""
              type="link"
            />
          </Box>
          {/* PDF Resources editable list */}
          <Box gridArea="pdfs">
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              PDF Resources
            </Typography>
            <EditableList
              items={challenge.pdfs || []}
              onUpdate={async (idx, value) => {
                await updateSingleChallengePdf(id, idx, value, token)
                const updated = await getChallengeById(id, token)
                setChallenge(updated)
              }}
              onAdd={async (value) => {
                await addChallengePdf(id, value, token)
                const updated = await getChallengeById(id, token)
                setChallenge(updated)
              }}
              onDelete={async (idx) => {
                await deleteSingleChallengePdf(id, idx, token)
                const updated = await getChallengeById(id, token)
                setChallenge(updated)
              }}
              label=""
              type="pdf"
            />
          </Box>
        </Box>
      </Container>
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Challenge</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this challenge? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="black">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              try {
                await deleteChallenge(challenge._id, token)
                setDeleteDialogOpen(false)
                navigate("/coordinator-challenges")
              } catch (err) {
                setDeleteDialogOpen(false)
                alert(
                  err.response?.data?.message || "Failed to delete challenge"
                )
              }
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default CoordinatorManageChallenge
