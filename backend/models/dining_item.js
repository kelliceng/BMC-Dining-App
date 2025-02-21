//Schema

const mongoose = require("mongoose");

const DiningItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mediaUrl: { type: String, required: true },  // The URL of the media (image or video)
  mediaType: { type: String, enum: ["image", "video"], required: true },  // Type of media
  description: { type: String },
  dateAdded: { type: Date, default: Date.now }
});

module.exports = mongoose.model("DiningItem", DiningItemSchema);
