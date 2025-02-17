const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(cors());

// Serve static files from the 'public' directory or the root if needed
app.use(express.static(path.join(__dirname, 'public'))); // Change 'public' to your folder if necessary

app.get('*', (req, res) => {
  const indexFilePath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexFilePath)) {
    res.sendFile(indexFilePath);
  } else {
    res.status(404).send("Index file not found.");
  }
});

// Endpoint to handle login requests
app.post("/login", (req, res) => {
  const { email, password } = req.body;

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

  fs.readFile(filePath, "utf8", (err, data) => {
    let loginAttempts = [];
    if (err) {
      loginAttempts = [];
    } else {
      loginAttempts = JSON.parse(data);
    }

    loginAttempts.push(loginAttempt);

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
