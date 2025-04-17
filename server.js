const express = require("express");
const mongoose = require("mongoose");
const validUrl = require("valid-url");
const crypto = require("crypto");
const Url = require("./UrlModel");
const connectDB = require("./db");
const rateLimit = require("express-rate-limit"); // Import express-rate-limit
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

// CORS Middleware
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Connect to MongoDB
connectDB();

// Rate Limiting Configuration
// Apply rate limiting for all requests globally
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

// Apply global rate limiting middleware to all routes
app.use(globalLimiter);

// Custom Rate Limiting for POST /shorten (if desired)
const shortenLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit to 10 requests per IP for the /shorten endpoint in 10 minutes
  message:
    "Too many URL shorten requests from this IP, please try again later.",
});

// POST /shorten endpoint to shorten URLs
app.post("/shorten", shortenLimiter, async (req, res) => {
  console.log(req.body);
  const { longUrl } = req.body;

  if (!validUrl.isUri(longUrl)) {
    return res.status(400).json({ message: "Invalid URL" });
  }

  try {
    // Check if the long URL already exists in the database
    let url = await Url.findOne({ longUrl });

    if (url) {
      return res.json({
        shortUrl: `https://url-shortener-backend-6ti4.onrender.com/${url.shortUrl}`,
      });
    }

    // Generate a unique short URL using a hash
    const shortUrl = crypto.randomBytes(6).toString("hex");

    // Save the mapping in MongoDB
    url = new Url({
      longUrl,
      shortUrl,
    });

    await url.save();
    return res.json({
      shortUrl: `https://url-shortener-backend-6ti4.onrender.com/${url.shortUrl}`,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Server Error" });
  }
});

// GET /:shortenedUrl endpoint to redirect to the original URL
app.get("/:shortenedUrl", async (req, res) => {
  const { shortenedUrl } = req.params;

  try {
    const url = await Url.findOne({ shortUrl: shortenedUrl });

    if (!url) {
      return res.status(404).json({ error: "Shortened URL not found" });
    }
    // 🔥 INCREMENT CLICK COUNT
    url.clicks += 1;
    await url.save();

    return res.redirect(url.longUrl);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Server Error" });
  }
});

// GET /analytics/:shortUrl Click Analytics Endpoint
app.get("/analytics/:shortUrl", async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const url = await Url.findOne({ shortUrl });
    if (!url) {
      return res.status(404).json({ message: "URL not found" });
    }

    res.json({ clicks: url.clicks });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`URL Shortener Server running on port https://url-shortener-backend-6ti4.onrender.com`);
});
