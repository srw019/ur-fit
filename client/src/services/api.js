/**
 * api.js
 * ------
 * Centralizes all API calls for the UR Fit client using Axios.
 */

import axios from "axios"

// Create an Axios instance with the base API URL
const API = axios.create({
  baseURL: "http://localhost:3002/api",
})

// Authentication endpoints
export const signup = (formData) => API.post("/auth/signup", formData)
export const login = (formData) => API.post("/auth/login", formData)

// Get all challenges (requires auth token)
export const getAllChallenges = (token) =>
  API.get("/challenges", { headers: { Authorization: `Bearer ${token}` } })

// Get challenges joined by the current user
export const getJoinedChallenges = (token) =>
  API.get("/challenges/joined/me", {
    headers: { Authorization: `Bearer ${token}` },
  })

// Join a challenge
export const joinChallenge = (challengeId, token) =>
  API.post(
    `/challenges/${challengeId}/join`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  )

// Leave a challenge
export const leaveChallenge = (challengeId, token) =>
  API.post(
    `/challenges/${challengeId}/leave`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  )

// Submit today's activity log for a challenge
export const submitChallengeLog = (challengeId, data, token) =>
  API.post(`/challenges/${challengeId}/log`, data, {
    headers: { Authorization: `Bearer ${token}` },
  })

// Get current user's logs for a challenge
export const getChallengeLogs = (challengeId, token) =>
  API.get(`/challenges/${challengeId}/logs/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

// Get challenge-specific leaderboard
export const getChallengeLeaderboard = (challengeId, token) =>
  API.get(`/challenges/${challengeId}/leaderboard`, {
    headers: { Authorization: `Bearer ${token}` },
  })

// Create a new challenge
export const createChallenge = (challengeData, token) =>
  API.post("/challenges", challengeData, {
    headers: { Authorization: `Bearer ${token}` },
  })

// Get a challenge by its ID
export const getChallengeById = async (id, token) => {
  const res = await API.get(`/challenges/${id}`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
  return res.data
}

// Enroll a user in a challenge (coordinator only)
export const userEnrollment = (data, token) =>
  API.post("/challenges/enroll", data, {
    headers: { Authorization: `Bearer ${token}` },
  })

// Invite a user to a challenge (coordinator)
export const inviteUser = (challengeId, userId, token) =>
  API.post(
    `/challenges/${challengeId}/invite`,
    { userId },
    { headers: { Authorization: `Bearer ${token}` } }
  )

// Get invitations for a challenge (coordinator)
export const getChallengeInvitations = (challengeId, token) =>
  API.get(`/challenges/${challengeId}/invitations`, {
    headers: { Authorization: `Bearer ${token}` },
  })

// Get current user's invitations
export const getUserInvitations = (token) =>
  API.get(`/users/me/invitations`, {
    headers: { Authorization: `Bearer ${token}` },
  })

// Accept / reject invitations (participant)
export const acceptInvitation = (challengeId, token) =>
  API.post(
    `/challenges/${challengeId}/invitations/accept`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  )

export const rejectInvitation = (challengeId, token) =>
  API.post(
    `/challenges/${challengeId}/invitations/reject`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  )

// Cancel a pending invitation (coordinator)
// cancel invitation helper removed

// Get all users (for coordinators)
export const getAllUsers = (token) =>
  API.get("/users", { headers: { Authorization: `Bearer ${token}` } })

// Update a single external link for a challenge
export const updateSingleChallengeLink = (id, index, newLink, token) =>
  API.put(
    `/challenges/${id}/links`,
    { index, newLink },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

// Update a single PDF resource for a challenge
export const updateSingleChallengePdf = (id, index, newPdf, token) =>
  API.put(
    `/challenges/${id}/pdf`,
    { index, newPdf },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

// Add a new external link to a challenge
export const addChallengeLink = (id, link, token) =>
  API.post(
    `/challenges/${id}/link`,
    { link },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

// Add a new PDF resource to a challenge
export const addChallengePdf = (id, pdf, token) =>
  API.post(
    `/challenges/${id}/pdf`,
    { pdf },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

// Delete a single external link from a challenge
export const deleteSingleChallengeLink = (id, index, token) =>
  API.delete(`/challenges/${id}/link`, {
    data: { index },
    headers: { Authorization: `Bearer ${token}` },
  })

// Delete a single PDF resource from a challenge
export const deleteSingleChallengePdf = (id, index, token) =>
  API.delete(`/challenges/${id}/pdf`, {
    data: { index },
    headers: { Authorization: `Bearer ${token}` },
  })

// Edit challenge details
export const editChallenge = (id, data, token) =>
  API.put(
    `/challenges/${id}/edit`,
    data,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

// Delete a challenge
export const deleteChallenge = (id, token) =>
  API.delete(`/challenges/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

// Export the Axios instance for custom requests if needed
export default API
