require("dotenv").config();
console.log("MongoDB URI:", process.env.MONGO_URI);

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { connectDB } = require("./database");
const DiningItem = require("./models/dining_item");

const app = express();
const PORT = process.env.PORT || 5002;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Configuration (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());  // To handle JSON request bodies
app.use(express.urlencoded({ extended: true }));  // To handle form data in requests

// Connect to MongoDB
connectDB().then(() => {
  console.log("Connected to MongoDB successfully");
}).catch(err => {
  console.error("Error connecting to MongoDB:", err);
  process.exit(1);  // Exit on DB failure
});

// Example Route
app.get("/", (req, res) => {
  res.send("BMC Dining App Backend Running!");
});

// Route for adding submissions
app.post("/api/dining/add", upload.single("mediaFile"), async (req, res) => {
  console.log("Received request at /api/dining/add");
  console.log("Received Body:", req.body);
  console.log("Received File:", req.file);

  try {
    const { name, email, caption, mediaType } = req.body;

    if (!name || !email || !mediaType || !caption || !req.file) {
      console.log("Missing fields or file, returning error.");
      return res.status(400).json({ error: "All fields are required, including the media file." });
    }

    // Check if mediaType is valid
    if (mediaType !== "image" && mediaType !== "video") {
      console.log("Invalid media type:", mediaType);
      return res.status(400).json({ error: "Invalid media type. Allowed types: 'image' or 'video'." });
    }

    console.log("Uploading to Cloudinary...");
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { 
          resource_type: mediaType,
          public_id: `${name}_${Date.now()}`,
        },
        (error, image) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(image);
          }
        }
      );
      stream.end(req.file.buffer);
    });

    console.log("Cloudinary upload successful:", result.secure_url);

    // Save to MongoDB
    const newItem = new DiningItem({
      name,
      email,
      mediaUrl: result.secure_url,
      mediaType,
      caption,
    });

    await newItem.save();
    console.log("Saved to MongoDB:", newItem);
    res.status(201).json(newItem);  // Respond with the new submission

  } catch (error) {
    console.log("General error in try-catch:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

app.get("/api/dining/submissions", async (req, res) => {
  try {
    const submissions = await DiningItem.find();  // Fetch all submissions from MongoDB
    res.json(submissions);  // Send the submissions as JSON response
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Unable to fetch submissions" });
  }
});


// 404 Error handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
