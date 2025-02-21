require("dotenv").config();
console.log("MongoDB URI:", process.env.MONGO_URI);

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { connectDB } = require("./database"); // ✅ Correct import
const DiningItem = require("./models/dining_item");  // Import the DiningItem model

const app = express();
const PORT = process.env.PORT || 5002;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Configuration (memory storage)
const storage = multer.memoryStorage(); // Storing files in memory for upload
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
// Removed express.json() since it's causing issues with form-data requests

// Connect to MongoDB
connectDB();

// Example Route
app.get("/", (req, res) => {
  res.send("BMC Dining App Backend Running!");
});

// Import Routes (must be after app is defined)
const dining_routes = require("./routes/dining_routes");
app.use("/api/dining/add", dining_routes);

app.post("/api/dining/add", upload.single("mediaFile"), async (req, res) => {
  console.log("Received request at /api/dining/add");
  console.log("Received Body:", req.body);  // Check if the form fields are coming through correctly
  console.log("Received File:", req.file);  // Check if the file is uploaded correctly
  
  try {
    const { name, email, caption, mediaType } = req.body;

    if (!name || !email || !mediaType || !caption || !req.file) {
      console.log("Missing fields or file, returning error.");
      return res.status(400).json({ error: "All fields are required, including the media file." });
    }

    console.log("name:", name, "email:", email, "caption:", caption, "mediaType:", mediaType);

    // Check if the mediaType is 'image' or 'video'
    if (mediaType !== "image" && mediaType !== "video") {
      console.log("Invalid media type:", mediaType);
      return res.status(400).json({ error: "Invalid media type. Allowed types: 'image' or 'video'." });
    }

    console.log("Uploading to Cloudinary...");

    // Use Cloudinary's upload_stream with a buffer
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { 
          resource_type: mediaType,  // Specify if it's an image or video
          public_id: `${name}_${Date.now()}`,  // Optional: Add a unique public ID
        },
        (error, image) => {
          if (error) {
            reject(error); // Reject the promise if there's an error
          } else {
            resolve(image); // Resolve the promise with the Cloudinary response
          }
        }
      );
      
      // Pipe the file buffer to Cloudinary's stream
      stream.end(req.file.buffer);  // Pass the buffer to the stream's end method
    });

    console.log("Cloudinary upload successful:", result.secure_url);

    // Save data in MongoDB
    const newItem = new DiningItem({
      name,
      email,
      mediaUrl: result.secure_url, // Store Cloudinary URL
      mediaType,
      caption,
    });

    await newItem.save();
    console.log("Saved to MongoDB:", newItem);
    res.status(201).json(newItem); // Respond with saved item

  } catch (error) {
    console.log("General error in try-catch:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


