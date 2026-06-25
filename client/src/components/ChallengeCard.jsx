import React from "react"
import { Link } from "react-router-dom"
import { Button, Card, CardContent, Typography, Chip } from "@mui/material"

/**
 * ChallengeCard Component
 * -----------------------
 * Displays a summary card for a challenge, including image, title, description,
 * duration, participant count, and a join/edit button.
 */

const ChallengeCard = ({
  challenge,
  isJoined,
  onJoin,
  isCoordinator = false,
  userRole,
}) => {
  // Determine the link for the challenge based on user role
  const challengeLink =
    userRole === "coordinator"
      ? `/coordinator/challenges/${challenge._id}`
      : `/challenges/${challenge._id}`

  // Helper function to parse YYYY-MM-DD string as local date (not UTC)
  const parseLocalDate = (dateString) => {
    if (!dateString) return null
    // Extract just the date part (YYYY-MM-DD) from ISO string if needed
    const datePart = dateString.split('T')[0]
    const [year, month, day] = datePart.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Helper function to format date
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

  return (
    <Card
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image Section */}
      <div
        style={{
          height: "160px",
          backgroundColor: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Show challenge image if available */}
        {challenge.imageUrl && (
          <img
            src={challenge.imageUrl}
            alt={challenge.title}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        )}
      </div>

      {/* Content Section */}
      <CardContent style={{ flex: 1 }}>
        {/* Challenge title as a link */}
        <Typography
          variant="h6"
          component="h3"
          style={{ marginBottom: "12px", fontWeight: "600" }}
        >
          <Link
            to={challengeLink}
            style={{
              color: "#000",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {challenge.title}
          </Link>
        </Typography>

        {/* Challenge description */}
        <Typography
          variant="body2"
          color="textSecondary"
          style={{ marginBottom: "16px" }}
        >
          {challenge.description}
        </Typography>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: "12px",
            borderTop: "1px solid #f0f0f0",
          }}
        >
          {/* Chips for dates and participant count */}
          <div style={{ display: "flex", gap: "8px" }}>
            <Chip
              label={`${formatDate(challenge.startDate)}`}
              style={{ fontSize: "12px" }}
            />
            <Chip
              label={`${challenge.participantCount} Participants`}
              style={{ fontSize: "12px" }}
            />
          </div>
        </div>
      </CardContent>

      {/* Button Section */}
      <div style={{ padding: "0 16px 16px 16px" }}>
        {/* Show Edit button for coordinators, Join/Already Joined for participants */}
        {isCoordinator ? (
          <Button
            fullWidth
            variant="contained"
            component={Link}
            to={`/coordinator/challenges/${challenge._id}`}
            style={{ height: "42px", backgroundColor: "#000" }}
          >
            Edit Challenge
          </Button>
        ) : (
          <Button
            fullWidth
            variant={isJoined ? "outlined" : "contained"}
            onClick={() => !isJoined && onJoin(challenge._id)}
            disabled={isJoined}
            style={{
              height: "42px",
              backgroundColor: isJoined ? "transparent" : "#000",
              color: isJoined ? "#000" : "#fff",
              borderColor: "#000",
            }}
          >
            {isJoined ? "Already Joined" : "Join Challenge"}
          </Button>
        )}
      </div>
    </Card>
  )
}

export default ChallengeCard
