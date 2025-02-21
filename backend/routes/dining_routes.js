// API routes

const express = require("express");
const DiningItem = require("../models/dining_item"); // ✅ Ensure correct model import
const router = express.Router();

// Add new item
router.post("/add", async (req, res) => {
  try {
    // Create new item from form data
    const newItem = new DiningItem(req.body); // Make sure `req.body` includes `mediaUrl`
    
    // Save the new item
    await newItem.save();
    res.status(201).json(newItem); // Return the saved item
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get all items
router.get("/", async (req, res) => {
  try {
    const items = await DiningItem.find(); 
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Get all dining submissions
router.get("/", async (req, res) => {
  try {
    const items = await DiningItem.find(); // Fetch all entries from MongoDB
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

