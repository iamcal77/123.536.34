const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(cors());

// Serve static files from the current directory or another directory
app.use(express.static(path.join(__dirname)));  // Serve from the root directory, adjust if necessary

// Catch-all route to serve the HTML files if you're using single-page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));  // Change 'index.html' to your main HTML file if necessary
});

// Endpoint to handle login requests
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  
  // Simulate checking against hardcoded credentials
  if (email && password) {
    logLoginAttempt(email, "success");
    return res.status(200).json({ message: "Login successful" });
  } else {
    logLoginAttempt(email, "failure");
    return res.status(401).json({ message: "Invalid credentials" });
  }
});

// Endpoint to fetch users (login attempts)
app.get("/users", (req, res) => {
  const filePath = path.join(__dirname, "loginAttempts.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Error reading login attempts" });
    }

    const loginAttempts = JSON.parse(data || "[]");
    res.json(loginAttempts);
  });
});

// Function to log login attempts to a JSON file
function logLoginAttempt(email, status) {
  const loginAttempt = {
    email,
    status,
    timestamp: new Date().toISOString(),
  };

  const filePath = path.join(__dirname, "loginAttempts.json");

  // Read existing data from the file (if any)
  fs.readFile(filePath, "utf8", (err, data) => {
    let loginAttempts = [];
    if (err) {
      loginAttempts = [];
    } else {
      loginAttempts = JSON.parse(data);
    }

    // Add the new login attempt to the array
    loginAttempts.push(loginAttempt);

    // Write the updated login attempts back to the JSON file
    fs.writeFile(filePath, JSON.stringify(loginAttempts, null, 2), "utf8", (err) => {
      if (err) {
        console.error("Error saving login attempts:", err);
      } else {
        console.log("Login attempt logged.");
      }
    });
  });
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
