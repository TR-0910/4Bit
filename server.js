const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Store OTPs temporarily
const otpStorage = new Map();

// Generate random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ⚠️ REPLACE THESE WITH YOUR ACTUAL GMAIL CREDENTIALS ⚠️
const emailConfig = {
    service: 'gmail',
    auth: {
        user: 'tanmayirebbapragada@gmail.com',     // Your Gmail address
        pass: 'sivoomcgurjxyhwp' // Your App Password from Step 2
    }
};

const transporter = nodemailer.createTransport(emailConfig);

// Endpoint to send OTP via Email
app.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid email address' 
        });
    }

    const otp = generateOTP();
    
    try {
        // Store OTP with timestamp (10 minutes)
        otpStorage.set(email, {
            otp: otp,
            expiresAt: Date.now() + 10 * 60 * 1000
        });

        // Send email
        const mailOptions = {
            from: 'CredSync <your-email@gmail.com>',
            to: email,
            subject: 'Your CredSync Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #9CAF88;">CredSync Verification</h2>
                    <p>Your verification code is:</p>
                    <h1 style="font-size: 32px; color: #7A8C69; letter-spacing: 5px;">${otp}</h1>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you didn't request this code, please ignore this email.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">CredSync - Privacy First, Security Always</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        
        console.log(`✅ OTP ${otp} sent to ${email}`);
        
        res.json({ 
            success: true, 
            message: 'Verification code sent to your email' 
        });
        
    } catch (error) {
        console.error('❌ Email error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send verification code. Please try again.' 
        });
    }
});

// Endpoint to verify OTP
app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email and OTP are required' 
        });
    }

    const storedData = otpStorage.get(email);
    
    if (!storedData) {
        return res.status(400).json({ 
            success: false, 
            error: 'OTP not found or expired' 
        });
    }

    if (Date.now() > storedData.expiresAt) {
        otpStorage.delete(email);
        return res.status(400).json({ 
            success: false, 
            error: 'OTP has expired' 
        });
    }

    if (storedData.otp === otp) {
        otpStorage.delete(email);
        res.json({ 
            success: true, 
            message: 'Email verified successfully' 
        });
    } else {
        res.status(400).json({ 
            success: false, 
            error: 'Invalid OTP' 
        });
    }
});

// Serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/Dash', (req, res) => {
    res.sendFile(path.join(__dirname, 'Dash.html'));
});
// Add this route handler for the root URL
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head><title>CredSync</title></head>
            <body>
                <h1>CredSync Server is Running! ✅</h1>
                <p>Server is working properly on Render.</p>
                <p>Check your specific routes for the actual application.</p>
            </body>
        </html>
    `);
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📧 Email OTP system ready!`);
});
