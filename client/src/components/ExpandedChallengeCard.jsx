import React from "react"
import { Link } from "react-router-dom"
import { Button, Chip, Divider } from "@mui/material"

/**
 * ExpandedChallengeCard Component
 * -------------------------------
 * Bigger challenge card with more description and action button.
 */

const ExpandedChallengeCard = ({
  challenge,
  isJoined,
  onJoin,
  isCoordinator = false,
}) => {
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
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "240px",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        marginBottom: "5px",
        backgroundColor: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      {/* Left side - Content */}
      <div
        style={{
          flex: "7",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        <div>
          {/* Challenge title as a link */}
          <h2
            style={{
              margin: "0 0 12px 0",
              fontWeight: "600",
              fontSize: "22px",
            }}
          >
            <Link
              to={`/challenges/${challenge._id}`}
              style={{
                color: "black",
                textDecoration: "none",
              }}
            >
              {challenge.title}
            </Link>
          </h2>

          {/* Challenge description */}
          <p
            style={{
              margin: "0 0 16px 0",
              fontSize: "14px",
              color: "#666",
            }}
          >
            {challenge.description}
          </p>

          <Divider style={{ margin: "12px 0" }} />

          {/* Long description (truncated) */}
          {challenge.longDescription && (
            <p
              style={{
                margin: "0 0 16px 0",
                color: "#000",
                fontSize: "16px",
                maxHeight: "60px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {challenge.longDescription}
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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

          {/* Edit button for coordinators, Join/Joined for participants */}
          {isCoordinator ? (
            <Button
              component={Link}
              to={`/challenges/${challenge._id}`}
              variant="contained"
              style={{
                backgroundColor: "black",
                color: "white",
                minWidth: "120px",
                fontSize: "14px",
              }}
            >
              Edit
            </Button>
          ) : (
            <Button
              onClick={() => !isJoined && onJoin(challenge._id)}
              variant={isJoined ? "outlined" : "contained"}
              disabled={isJoined}
              style={{
                backgroundColor: isJoined ? "transparent" : "black",
                color: isJoined ? "black" : "white",
                borderColor: "black",
                minWidth: "120px",
                fontSize: "14px",
              }}
            >
              {isJoined ? "Joined" : "Join"}
            </Button>
          )}
        </div>
      </div>

      {/* Right side - Image */}
      <div
        style={{
          flex: "3",
          minWidth: "150px",
          maxWidth: "200px",
          backgroundColor: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Challenge image or fallback text */}
        {challenge.imageUrl ? (
          <img
            src={challenge.imageUrl}
            alt={challenge.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <span style={{ color: "#999", fontSize: "16px" }}>No Image</span>
        )}
      </div>
    </div>
  )
}

export default ExpandedChallengeCard
