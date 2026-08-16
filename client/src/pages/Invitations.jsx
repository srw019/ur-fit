import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
} from "@mui/material"
import Navbar from "../components/Navbar"
import { getUserInvitations, acceptInvitation, rejectInvitation } from "../services/api"

const Invitations = () => {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  let user = null
  try {
    if (token) user = jwtDecode(token)
  } catch {
    user = null
  }

  useEffect(() => {
    if (!token) {
      navigate("/login")
      return
    }
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await getUserInvitations(token)
        setInvitations(res.data || [])
      } catch (err) {
        setInvitations([])
      }
      setLoading(false)
    }
    fetch()
  }, [token, navigate])

  const handleView = (challengeId) => {
    navigate(`/challenges/${challengeId}`)
  }

  const handleAccept = async (challengeId) => {
    try {
      await acceptInvitation(challengeId, token)
      const res = await getUserInvitations(token)
      setInvitations(res.data || [])
    } catch (err) {
      alert(err.response?.data?.message || "Unable to accept invitation")
    }
  }

  const handleReject = async (challengeId) => {
    try {
      await rejectInvitation(challengeId, token)
      const res = await getUserInvitations(token)
      setInvitations(res.data || [])
    } catch (err) {
      alert(err.response?.data?.message || "Unable to reject invitation")
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={48} />
      </Box>
    )
  }

  return (
    <div>
      <Navbar user={user} onLogout={() => { localStorage.removeItem('token'); navigate('/login') }} />
      <Container sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
          Invitations
        </Typography>
        {invitations.length === 0 && (
          <Typography variant="body1" color="text.secondary">You have no invitations.</Typography>
        )}
        <Box display="grid" gap={2} mt={2}>
          {invitations.map((inv) => (
            <Card key={inv.challengeId}>
              <CardContent>
                <Typography variant="h6">{inv.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {inv.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {inv.status}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => handleView(inv.challengeId)}>View Details</Button>
                {inv.status === 'pending' && (
                  <>
                    <Button size="small" color="primary" onClick={() => handleAccept(inv.challengeId)}>Accept</Button>
                    <Button size="small" color="error" onClick={() => handleReject(inv.challengeId)}>Reject</Button>
                  </>
                )}
              </CardActions>
            </Card>
          ))}
        </Box>
      </Container>
    </div>
  )
}

export default Invitations
