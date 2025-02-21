const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

const VERIFICATION_FILE = path.join(__dirname, "verificationCodes.json");

// Middleware configuration
app.use(express.json());
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "senopay.html"));
});

// Function to read verification codes from file
function readVerificationCodes() {
    try {
        if (!fs.existsSync(VERIFICATION_FILE)) {
            fs.writeFileSync(VERIFICATION_FILE, JSON.stringify({}, null, 2));
        }
        return JSON.parse(fs.readFileSync(VERIFICATION_FILE, "utf8"));
    } catch (err) {
        console.error("Error reading verification codes:", err);
        return {};
    }
}

// Function to write verification codes to file
function writeVerificationCodes(codes) {
    try {
        fs.writeFileSync(VERIFICATION_FILE, JSON.stringify(codes, null, 2), "utf8");
    } catch (err) {
        console.error("Error writing verification codes:", err);
    }
}

// API endpoint for login
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (email && password) {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Read current codes, update, and save back to file
        const verificationCodes = readVerificationCodes();
        verificationCodes[email] = verificationCode;
        writeVerificationCodes(verificationCodes);

        logLoginAttempt(email, "success");

        return res.status(200).json({ 
            message: "Login successful. Verification required.",
            verificationCode, // ⚠️ Remove this in production (just for testing)
        });
    } else {
        logLoginAttempt(email, "failure");
        return res.status(401).json({ message: "Invalid credentials" });
    }
});
// API endpoint to get the list of login attempts
app.get("/users", (req, res) => {
    const filePath = path.join(__dirname, "loginAttempts.json");

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading login attempts:", err);
            return res.status(500).json({ message: "Error retrieving login attempts" });
        }

        try {
            const loginAttempts = JSON.parse(data);
            return res.status(200).json(loginAttempts);
        } catch (parseErr) {
            console.error("Error parsing login attempts:", parseErr);
            return res.status(500).json({ message: "Error parsing login attempts data" });
        }
    });
});


// API endpoint for verification
app.post("/verify", (req, res) => {
    const { email, code } = req.body;
    
    // Read stored verification codes
    const verificationCodes = readVerificationCodes();
    
    if (verificationCodes[email] && verificationCodes[email] === code) {
        delete verificationCodes[email]; // Remove code after successful verification
        writeVerificationCodes(verificationCodes);
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
        if (!err && data) {
            try {
                loginAttempts = JSON.parse(data);
            } catch (parseErr) {
                console.error("Error parsing login attempts:", parseErr);
            }
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
