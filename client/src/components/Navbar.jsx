import React from "react"
import { Link, useLocation } from "react-router-dom"
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material"

/**
 * Navbar Component
 * ----------------
 * Shows the top navigation bar and links for the app.
 */

const Navbar = ({ user, onLogout }) => {
  const location = useLocation()

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{
        borderBottom: "1px solid #000",
        boxShadow: "none",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {/* App title */}
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          UR Fit
        </Typography>
        <Box sx={{ display: "flex", gap: "24px", alignItems: "center" }}>
          {/* Home link */}
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Typography>Home</Typography>
          </Link>
          {/* Challenges link */}
          <Link
            to="/challenges"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Typography>Challenges</Typography>
          </Link>
          {/* Enrollment link only for coordinators */}
          {user && user.role === "coordinator" && (
            <Link
              to="/enrollment"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Typography>Enrollment</Typography>
            </Link>
          )}
          {/* Auth buttons: Logout for logged-in, Sign In/Sign Up for guests */}
          {user ? (
            // Logout button for authenticated users
            <Button
              onClick={onLogout}
              variant="contained"
              size="medium"
              sx={{
                backgroundColor: "#000",
                color: "#fff",
                fontWeight: 500,
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: "#333",
                  color: "#fff",
                },
              }}
            >
              Logout
            </Button>
          ) : location.pathname === "/signup" ? (
            // Show Sign In button if on signup page
            <Button
              component={Link}
              to="/login"
              variant="contained"
              size="small"
              sx={{
                backgroundColor: "#000",
                color: "#fff",
                fontWeight: 500,
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: "#333",
                  color: "#fff",
                },
              }}
            >
              Sign In
            </Button>
          ) : location.pathname === "/login" ? (
            // Show Sign Up button if on login page
            <Button
              component={Link}
              to="/signup"
              variant="contained"
              size="small"
              sx={{
                backgroundColor: "#000",
                color: "#fff",
                fontWeight: 500,
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: "#333",
                  color: "#fff",
                },
              }}
            >
              Sign Up
            </Button>
          ) : (
            // Show both Sign In and Sign Up buttons on other pages for guests
            <>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: "#000",
                  color: "#fff",
                  fontWeight: 500,
                  borderRadius: "4px",
                  "&:hover": {
                    backgroundColor: "#333",
                    color: "#fff",
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                component={Link}
                to="/signup"
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: "#000",
                  color: "#fff",
                  fontWeight: 500,
                  borderRadius: "4px",
                  "&:hover": {
                    backgroundColor: "#333",
                    color: "#fff",
                  },
                }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
