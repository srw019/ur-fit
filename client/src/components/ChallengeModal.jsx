import React, { useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"

/**
 * ChallengeModal Component
 * ------------------------
 * Renders a modal dialog for creating a new challenge.
 */

const ChallengeModal = ({ open, onClose, onCreate }) => {
  // State for form fields, error message, and image file
  const [form, setForm] = useState({
    title: "",
    description: "",
    longDescription: "",
    startDate: "",
    endDate: "",
    imageUrl: "",
    externalLink: "",
    pdfs: "",
  })
  const [error, setError] = useState("")
  const [imageFile, setImageFile] = useState(null)

  // Get today's date in YYYY-MM-DD format (local timezone)
  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Handle image file selection
  const handleFileChange = (e) => {
    setImageFile(e.target.files[0])
  }

  // Send the form to the server when user clicks create
  const handleSubmit = async () => {
    setError("")
    let imageUrl = form.imageUrl

    // Check the required fields first
    if (!form.title || !form.description || !form.startDate || !form.endDate) {
      setError("Title, Description, Start Date, and End Date are required.")
      return
    }

    // Make sure start isn't in the past
    const today = getTodayDate()
    if (form.startDate < today) {
      setError("Start date cannot be before today.")
      return
    }

    // End needs to be after start
    if (form.endDate <= form.startDate) {
      setError("End date must be after start date.")
      return
    }

    // Upload image if a file is selected
    if (imageFile) {
      const data = new FormData()
      data.append("image", imageFile)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      })
      const result = await res.json()
      imageUrl = result.imageUrl
    }

    // Call onCreate with the new challenge data
    try {
      await onCreate({
        ...form,
        imageUrl,
        externalLink: form.externalLink
          ? form.externalLink.split(",").map((l) => l.trim())
          : [],
        pdfs: form.pdfs ? form.pdfs.split(",").map((l) => l.trim()) : [],
      })

      // Reset form and image file
      setForm({
        title: "",
        description: "",
        longDescription: "",
        startDate: "",
        endDate: "",
        imageUrl: "",
        externalLink: "",
        pdfs: "",
      })
      setImageFile(null)
    } catch (err) {
      setError("Failed to create challenge. Please try again.")
      console.error("Error:", err)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Create New Challenge
        {/* Close button in the top-right corner */}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Title input */}
        <TextField
          margin="normal"
          label="Title"
          name="title"
          fullWidth
          value={form.title}
          onChange={handleChange}
          required
        />
        {/* Short Description input */}
        <TextField
          margin="normal"
          label="Short Description"
          name="description"
          fullWidth
          value={form.description}
          onChange={handleChange}
          required
        />
        {/* Long Description input */}
        <TextField
          margin="normal"
          label="Long Description"
          name="longDescription"
          fullWidth
          multiline
          minRows={3}
          value={form.longDescription}
          onChange={handleChange}
        />
        {/* Start Date input */}
        <TextField
          margin="normal"
          label="Start Date"
          name="startDate"
          type="date"
          fullWidth
          value={form.startDate}
          onChange={handleChange}
          inputProps={{
            min: getTodayDate(),
          }}
          InputLabelProps={{ shrink: true }}
          required
        />
        {/* End Date input */}
        <TextField
          margin="normal"
          label="End Date"
          name="endDate"
          type="date"
          fullWidth
          value={form.endDate}
          onChange={handleChange}
          inputProps={{
            min: form.startDate || getTodayDate(),
          }}
          InputLabelProps={{ shrink: true }}
          required
        />
        {/* Image upload input */}
        <TextField
          margin="normal"
          label="Upload Image"
          name="image"
          type="file"
          fullWidth
          InputLabelProps={{ shrink: true }}
          inputProps={{ accept: "image/*" }}
          onChange={handleFileChange}
        />
        {/* External Links input */}
        <TextField
          margin="normal"
          label="External Links (comma separated)"
          name="externalLink"
          fullWidth
          value={form.externalLink}
          onChange={handleChange}
          placeholder="https://youtube.com/..., https://resource.com/..."
        />
        {/* PDF Links input */}
        <TextField
          margin="normal"
          label="PDF Links (comma separated)"
          name="pdfs"
          fullWidth
          value={form.pdfs}
          onChange={handleChange}
          placeholder="https://example.com/file.pdf"
        />
        {/* Error message */}
        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        {/* Cancel and Create buttons */}
        <Button onClick={onClose} color="black" variant="outlined">
          Cancel
        </Button>
        <Button
          variant="outlined"
          onClick={handleSubmit}
          color="black"
          sx={{
            backgroundColor: "black",
            color: "white",
            "&:hover": { backgroundColor: "#333" },
          }}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ChallengeModal
