const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

// Middleware configuration
app.use(express.json());
app.use(cors());

const verificationCodes = {}; // Temporary store for verification codes

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'senopay.html')); // Change 'home.html' to your preferred page
});
// API endpoint for login
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (email && password) {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        verificationCodes[email] = verificationCode; // Store the code temporarily

        logLoginAttempt(email, "success");
        
        // Send the code in the response (replace with email sending logic in production)
        return res.status(200).json({ 
            message: "Login successful. Verification required.",
            verificationCode 
        });
    } else {
        logLoginAttempt(email, "failure");
        return res.status(401).json({ message: "Invalid credentials" });
    }
});

// API endpoint for verification
app.post("/verify", (req, res) => {
    const { email, code } = req.body;

    if (verificationCodes[email] === code) {
        delete verificationCodes[email]; // Remove the code after successful verification
        return res.status(200).json({ message: "Verification successful" });
    } else {
        return res.status(400).json({ message: "Invalid or expired verification code" });
    }
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
        if (!err) {
            loginAttempts = JSON.parse(data);
        }
        loginAttempts.push(loginAttempt);
        fs.writeFile(filePath, JSON.stringify(loginAttempts, null, 2), "utf8", (err) => {
            if (err) {
                console.error("Error saving login attempts:", err);
            }
        });
    });
}

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
