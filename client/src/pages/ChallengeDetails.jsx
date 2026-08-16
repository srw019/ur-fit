import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import {
  Box,
  Typography,
  Container,
  Chip,
  Divider,
  CircularProgress,
  Button,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import StarIcon from "@mui/icons-material/Star"
import StarBorderIcon from "@mui/icons-material/StarBorder"
import IconButton from "@mui/material/IconButton"
import Switch from "@mui/material/Switch"
import FormControlLabel from "@mui/material/FormControlLabel"
import { getChallengeById, getChallengeLogs, getChallengeLeaderboard, submitChallengeLog, joinChallenge, leaveChallenge } from "../services/api"
import Navbar from "../components/Navbar"

// View challenge details, logs, and leaderboard
const ChallengeDetails = () => {
  const { id } = useParams()
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [activityValue, setActivityValue] = useState("")
  const [notes, setNotes] = useState("")
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")
  const [pointsEarned, setPointsEarned] = useState(null)
  const [hasLoggedToday, setHasLoggedToday] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [yourRank, setYourRank] = useState(null)
  const [yourPoints, setYourPoints] = useState(0)
  const [pointsToNext, setPointsToNext] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [starred, setStarred] = useState(new Set())
  const [showStarredOnly, setShowStarredOnly] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  let user = null

  // get user from token
  try {
    if (token) user = jwtDecode(token)
  } catch {
    user = null
  }

  // check if participant
  useEffect(() => {
    if (!token) {
      navigate("/login")
      return
    }
    try {
      const decoded = jwtDecode(token)
      if (decoded.role !== "participant") {
        navigate("/login")
      }
    } catch {
      navigate("/login")
    }
  }, [token, navigate])

  // load challenge on mount
  useEffect(() => {
    const fetchChallenge = async () => {
      setLoading(true)
      try {
        const challenge = await getChallengeById(id, token)
        setChallenge(challenge)

        let logsData = []
        let leaderboardData = []
        try {
          const logsResponse = await getChallengeLogs(id, token)
          logsData = logsResponse.data
        } catch (logErr) {
          if (
            logErr?.response?.status !== 403 &&
            logErr?.response?.status !== 404
          ) {
            console.error("Error fetching logs:", logErr)
          }
        }

        try {
          const leaderboardResponse = await getChallengeLeaderboard(id, token)
          leaderboardData = leaderboardResponse.data
        } catch (leaderboardErr) {
          console.error("Error fetching leaderboard:", leaderboardErr)
        }

        setLogs(logsData)
        updateLeaderboardState(leaderboardData)

        const today = parseLocalDate(new Date().toISOString())
        const loggedToday = logsData.some((log) => {
          const logDate = parseLocalDate(log.logDate)
          return logDate && logDate.getTime() === today.getTime()
        })
        setHasLoggedToday(loggedToday)
      } catch (err) {
        console.error("Error fetching challenge:", err)
        setChallenge(null)
      }
      setLoading(false)
    }
    fetchChallenge()
  }, [id, token])

  // load starred from storage
  useEffect(() => {
    if (!id || !token) return
    let decoded = null
    try {
      decoded = jwtDecode(token)
    } catch {
      decoded = null
    }
    const viewerId = decoded?.userId || decoded?.id || decoded?._id
    if (!viewerId) return
    try {
      const key = `starred:${id}:${viewerId}`
      const raw = localStorage.getItem(key)
      if (raw) {
        const arr = JSON.parse(raw)
        const newSet = new Set(Array.isArray(arr) ? arr : [])
        const curr = Array.from(starred)
        const nextArr = Array.from(newSet)
        if (JSON.stringify(curr) !== JSON.stringify(nextArr)) {
          setStarred(newSet)
        }
      }
    } catch (e) {
      // ignore
    }
  }, [id, token])

  const toggleStar = (studentId) => {
    if (!token) return
    let decoded = null
    try {
      decoded = jwtDecode(token)
    } catch {
      decoded = null
    }
    const viewerId = decoded?.userId || decoded?.id || decoded?._id
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

  const userHasJoinedChallenge = challenge?.participants?.some(
    (participant) =>
      participant?._id === user?.userId || participant?.toString() === user?.userId
  )

  const updateLeaderboardState = (leaderboardData) => {
    setLeaderboard(leaderboardData)
    const currentUserEntry = leaderboardData.find((entry) => {
      try {
        return String(entry?.student?._id) === String(user?.userId)
      } catch {
        return false
      }
    })

    if (currentUserEntry) {
      setYourRank(currentUserEntry.rank)
      setYourPoints(currentUserEntry.totalPoints)
      if (currentUserEntry.rank > 1) {
        const prevEntry = leaderboardData.find(
          (entry) => Number(entry.rank) === Number(currentUserEntry.rank) - 1
        )
        if (prevEntry && typeof prevEntry.totalPoints === 'number') {
          setPointsToNext(
            Math.max(0, prevEntry.totalPoints - currentUserEntry.totalPoints)
          )
        } else {
          setPointsToNext(null)
        }
      } else {
        setPointsToNext(null)
      }
    } else {
      setYourRank(null)
      setYourPoints(0)
      setPointsToNext(null)
    }
  }

  const refreshLeaderboard = async () => {
    try {
      const leaderboardResponse = await getChallengeLeaderboard(id, token)
      updateLeaderboardState(leaderboardResponse.data)
    } catch (leaderboardErr) {
      console.error("Error refreshing leaderboard:", leaderboardErr)
      setLeaderboard([])
      setYourRank(null)
      setYourPoints(0)
      setPointsToNext(null)
    }
  }

  const handleJoin = async () => {
    if (!token) {
      navigate('/login')
      return
    }
    setJoinLoading(true)
    try {
      await joinChallenge(id, token)
      // update challenge participants locally
      setChallenge((c) => ({
        ...c,
        participants: [...(c.participants || []), { _id: user.userId }],
        participantCount: (c.participantCount || 0) + 1,
      }))
      await refreshLeaderboard()
    } catch (err) {
      console.error('Join error', err)
      alert(err?.response?.data?.message || 'Unable to join challenge')
    }
    setJoinLoading(false)
  }

  const handleLeaveConfirm = () => setLeaveConfirmOpen(true)
  const handleCloseLeave = () => setLeaveConfirmOpen(false)

  const handleConfirmLeave = async () => {
    setJoinLoading(true)
    try {
      const res = await leaveChallenge(id, token)
      // update challenge participants locally
      setChallenge((c) => ({
        ...c,
        participants: (c.participants || []).filter(
          (p) => p._id !== user?.userId && p.toString() !== user?.userId
        ),
        participantCount: Math.max((c.participantCount || 1) - 1, 0),
      }))
      // clear logs and leaderboard for the UI
      setLogs([])
      setHasLoggedToday(false)
      setLeaderboard([])
      setYourRank(null)
      setYourPoints(0)
      setPointsToNext(null)
      setLeaveConfirmOpen(false)
    } catch (err) {
      console.error('Leave error', err)
      alert(err?.response?.data?.message || 'Unable to leave challenge')
    }
    setJoinLoading(false)
  }

  // parse date string
  const parseLocalDate = (dateString) => {
    if (!dateString) return null
    const datePart = dateString.split('T')[0]
    const [year, month, day] = datePart.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const handleSubmitLog = async () => {
    setSubmitError("")
    setSubmitSuccess("")
    setPointsEarned(null)

    if (!activityValue.trim()) {
      setSubmitError("Activity value is required.")
      return
    }

    setSubmitLoading(true)
    try {
      const response = await submitChallengeLog(
        id,
        { activityValue, notes },
        token
      )
      setSubmitSuccess(
        `Daily activity logged successfully. +${response.data.pointsEarned} points earned.`
      )
      setPointsEarned(response.data.pointsEarned)
      setHasLoggedToday(true)
      setLogs([response.data.activityLog, ...logs])
      await refreshLeaderboard()
      setActivityValue("")
      setNotes("")
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Unable to submit activity log. Please try again."
      setSubmitError(message)
    }
    setSubmitLoading(false)
  }

  // format date for display
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

  // logout
  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  // loading state
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

  // not found
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
      <Navbar user={user} onLogout={handleLogout} />
      <Box sx={{ pl: 2, pt: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/challenges")}
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
        <Box
          display="grid"
          gridTemplateAreas={{ xs: `"image" "details"`, md: `"image details"` }}
          gridTemplateColumns={{ xs: '1fr', md: '1fr 2fr' }}
          gap={4}
          alignItems="center"
        >
          <Box gridArea="image" display="flex" justifyContent="center">
            {challenge.imageUrl && (
              <img
                src={challenge.imageUrl}
                alt={challenge.title}
                style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 8 }}
              />
            )}
          </Box>
          <Box gridArea="details">
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {challenge.title}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
          </Box>
        </Box>
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
          gridTemplateAreas={`"links" "pdfs"`}
          gap={4}
          mt={4}
        >
          <Box gridArea="links">
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              External Links
            </Typography>
            {challenge.externalLink && challenge.externalLink.length > 0 ? (
              challenge.externalLink.map((link, idx) => (
                <Box key={idx} display="flex" alignItems="center" mb={1}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      marginBottom: 8,
                      marginRight: 8,
                      color: "#1976d2",
                      textDecoration: "underline",
                      wordBreak: "break-all",
                    }}
                  >
                    {link}
                  </a>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No external links.
              </Typography>
            )}
          </Box>
          <Box gridArea="pdfs">
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              PDF Resources
            </Typography>
            {challenge.pdfs && challenge.pdfs.length > 0 ? (
              challenge.pdfs.map((pdf, idx) => (
                <Box key={idx} display="flex" alignItems="center" mb={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    href={pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    sx={{
                      textTransform: "none",
                      backgroundColor: "#000",
                      color: "#fff",
                      "&:hover": { backgroundColor: "#333" },
                      mb: 1,
                    }}
                  >
                    PDF {idx + 1}
                  </Button>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No PDF resources.
              </Typography>
            )}
          </Box>
        </Box>
        <Container sx={{ py: 4 }}>
          <Box sx={{ p: 4, backgroundColor: "#fff", borderRadius: 2, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>Daily Activity Log</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Each log awards {challenge.pointsPerLog ?? 0} points</Typography>
              </Box>
              <Box>
                {userHasJoinedChallenge ? (
                  <>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleLeaveConfirm}
                      disabled={joinLoading}
                      sx={{ textTransform: 'none' , mr:2}}
                    >
                      Leave Challenge
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleJoin}
                    disabled={joinLoading}
                    sx={{ textTransform: 'none' }}
                  >
                    {joinLoading ? 'Processing...' : 'Join Challenge'}
                  </Button>
                )}
              </Box>
            </Box>
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}
            {submitSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {submitSuccess}
              </Alert>
            )}
            {!userHasJoinedChallenge && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Join this challenge to log your daily activity.
              </Alert>
            )}
            {hasLoggedToday && userHasJoinedChallenge && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Today's activity has already been logged.
              </Alert>
            )}
            <Box display="grid" gap={2}>
              <TextField
                label="What did you do today? (e.g. 10,000 steps)"
                value={activityValue}
                onChange={(e) => setActivityValue(e.target.value)}
                fullWidth
                disabled={!userHasJoinedChallenge || hasLoggedToday || submitLoading}
              />
              <TextField
                label="Notes (how did you do?)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                disabled={!userHasJoinedChallenge || hasLoggedToday || submitLoading}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitLog}
                disabled={!userHasJoinedChallenge || hasLoggedToday || submitLoading}
                sx={{ textTransform: "none", width: "fit-content" }}
              >
                {submitLoading ? "Submitting..." : "Submit Daily Log"}
              </Button>
            </Box>
            {logs && logs.length > 0 && (
              <Box mt={4}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Recent Logs
                </Typography>
                {logs.slice(0, 3).map((log) => (
                  <Box key={log._id} sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {formatDate(log.logDate)} — {log.activityValue}
                    </Typography>
                    {log.notes && (
                      <Typography variant="body2" color="text.secondary">
                        {log.notes}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      +{log.pointsEarned} points
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
            <Box mt={4}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>Challenge Leaderboard</Typography>
              
              {yourRank && yourRank > 1 && pointsToNext !== null && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  You are {pointsToNext} points away from the next position.
                </Typography>
              )}
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
                  gridTemplateColumns: { xs: '50px 40px 1fr 70px', md: '64px 40px 1fr 120px' },
                  backgroundColor: "#f5f5f5",
                  px: 2,
                  py: 1,
                  fontWeight: 700,
                }}
              >
                <Typography>Rank</Typography>
                <Typography />
                <Typography>Name</Typography>
                <Typography sx={{ textAlign: 'right' }}>Points</Typography>
              </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', px: 2, py: 1, flexWrap: 'wrap' }}>
                  <TextField
                    size="small"
                    placeholder="Search name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' }, minWidth: '150px' }}
                  />
                  <FormControlLabel
                    control={<Switch checked={showStarredOnly} onChange={(e) => setShowStarredOnly(e.target.checked)} />}
                    label="Starred"
                    sx={{ whiteSpace: 'nowrap' }}
                  />
                </Box>

                {(() => {
                  const filtered = leaderboard.filter((entry) => {
                    const q = searchQuery.trim().toLowerCase()
                    if (q) {
                      const name = (entry.student.name || "").toLowerCase()
                      if (!name.includes(q)) return false
                    }
                    if (showStarredOnly) return starred.has(entry.student._id)
                    return true
                  })

                  return filtered.map((entry) => {
                    const isCurrent = entry.student._id === user?.userId
                    const isStarred = starred.has(entry.student._id)
                    return (
                      <Box
                        key={entry.student._id}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: '50px 40px 1fr 70px', md: '64px 40px 1fr 120px' },
                          px: 2,
                          py: 1,
                          backgroundColor: isCurrent ? "rgba(25, 118, 210, 0.08)" : (isStarred ? "#fff8e1" : "#fff"),
                          borderLeft: isStarred ? "4px solid #ffd54f" : 'none',
                          alignItems: 'center'
                        }}
                      >
                        <Typography sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>{entry.rank}</Typography>
                        <IconButton onClick={() => toggleStar(entry.student._id)} size="small" aria-label={`star-${entry.student._id}`}>
                          {isStarred ? <StarIcon sx={{ color: '#ffb300' }} fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                        </IconButton>
                        <Typography sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.student.name || "Unknown"}</Typography>
                        <Typography sx={{ textAlign: 'right', fontSize: { xs: '0.9rem', md: '1rem' } }}>{entry.totalPoints}</Typography>
                      </Box>
                    )
                  })
                })()}
              </Box>
            </Box>
            <Dialog open={leaveConfirmOpen} onClose={handleCloseLeave}>
              <DialogTitle>Leave challenge?</DialogTitle>
              <DialogContent>
                Are you sure you want to leave this challenge? This will remove your
                activity logs for this challenge and remove you from the participant list.
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseLeave}>Cancel</Button>
                <Button color="error" onClick={handleConfirmLeave}>
                  Yes, leave
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Container>
      </Container>
    </div>
  )
}

export default ChallengeDetails
