const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');
const { type } = require('os');
const { timeStamp } = require('console');
const pool = require('./db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware

app.use(cors());

app.use(express.json());
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const allowedTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/ogg"
];

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .pdf, .docx, .txt, .csv, images(.jpeg, .png, .gif, .webp) and video(.mp4, .webm, .ogg) files are allowed!"), false);
    }
  }
});

// Serve static files (HTML, CSS, JS) Add this 
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rate limiting for OTP requests

const otpLimiter = rateLimit({

    windowMs: 15 * 60 * 1000, // 15 minutes

    max: 5, // limit each IP to 5 requests per windowMs 
    message: {
        error: 'Too many OTP requests from this IP, please try again later.'
    } 

});

//in-memory storage for OTPs (use Redis in production)
const otpStore = new Map();

//Email transporter configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
        }
    });
};

// Generate 6-digit OTP

const generateOTP = () => {

    return Math.floor(100000 + Math.random() * 900000).toString();
};

//Email template for OTP
const getOTPEmailTemplate = (otp, type) => {
    const isSignup = type === 'signup';

    return`
    <!DOCTYPE html>

    <html>

    <head>

        <style>

            body {

                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

                line-height: 1.6;

                color: #333;

                max-width: 600px;

                margin: 0 auto;

                padding: 20px;
            }

            .container{


                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

                border-radius: 15px;

                padding: 30px;

                text-align: center;

                color: white;
            }
                
            .otp-box{
                background: white;
                color: #333;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                font-size: 24px;
                font-weight: bold;
                letter-spacing: 3px;
            }

            .footer{
                margin-top: 20px;
                font-size: 14px;
                opacity: 0.9;
            }
        </style>
    </head>
    <body>
        <div class = "container">
            <h2>${isSignup ? 'Welcome! Verify your Email' : 'Login Verification'}</h2>
            <p>${isSignup ? 'Thank you for signing up! Use the OTP below to verify your email address.' : 'Please use the OTP below to complete your login.'}</p>
            <div class = "otp-box">
                ${otp}
            </div>
            <p><strong>This OTP will expire in 2 minutes.</strong></p>
            <div class = "footer">
                <p>If you didn't request this ${isSignup ? 'verification' : 'login'}, your account may be at risk. We advise you to change your account password or ignore this email.</p>
                <p>For security reasons, please do not share this OTP with anyone.</p>
            </div>
        </div>
    </body>
    </html>
    `;      
};

//API routes
//Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Send OTP endpoint
app.post('/api/send-otp', otpLimiter, async (req, res) => {
  try {
    const { email, type } = req.body;

    // Validate input
    if (!email || !type) {
      return res.status(400).json({
        success: false,
        message: 'Email and type are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const existingData = otpStore.get(email);

    // 15 min window = 900000 ms
    const RESEND_LIMIT = 3;
    const WINDOW_TIME = 15 * 60 * 1000;

    if (existingData) {
  
        const timePassed = Date.now() - existingData.firstRequestTime;

        // Reset after 15 min
        if (timePassed > WINDOW_TIME) {
            existingData.resendCount = 0;
            existingData.firstRequestTime = Date.now();
        }

        if (existingData.resendCount >= RESEND_LIMIT) {
            return res.status(429).json({
                success: false,
                message: 'Resend limit reached. Try again after 15 minutes.'
            });
        }

        existingData.resendCount += 1;
    }
    // Generate OTP
    const otp = generateOTP();

    // Store OTP with expiration (2 minutes)
    const otpData = {
      otp,
      email,
      type,
      createdAt: Date.now(),
      expiresAt: Date.now() + (2 * 60 * 1000), // 2 minutes
      resendCount: 0,              // track resends
  firstRequestTime: Date.now() // track 15 min window
    };

    if (existingData) {
  otpStore.set(email, {
    ...existingData,
    otp,
    expiresAt: Date.now() + (2 * 60 * 1000)
  });
} else {
  otpStore.set(email, otpData);
}

    // Create transporter
    const transporter = createTransporter();

    // Email options
    const mailOptions = {
      from: {
        name: 'Modern Auth System',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: type === 'signup' ? 'Verify Your Email OTP Code' : 'Login Verification OTP Code',
      html: getOTPEmailTemplate(otp, type)
    };

    // Send email
    await transporter.sendMail(mailOptions);

    console.log(`OTP sent successfully to ${email}`);
    console.log(`Generated OTP: ${otp} (expires in 2 minutes)`);
    
    res.json({
        success: true,
        message: 'OTP sent successfully',
        otp: otp, //remove this in production 
        expiresIn: 120 //seconds
    });
  } catch (error) {
    console.error('Error sending OTP:', error);

    let errorMessage = 'Failed to send OTP';

    //Handle specific email errors
    if(error.code === 'EAUTH') {
        errorMessage = 'Email authentication failed. Please check your credentials.';
    } else if (error.code === 'ENOTFOUND'){
        errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.responseCode === 550) {
        errorMessage = 'Invalid recipient email address.';
    }

    res.status(500).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
//new api
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, username, email, phone, password } = req.body;

    // Check if username already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await pool.query(
      `INSERT INTO users (full_name, username, email, phone, password_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      [fullName, username, email, phone, hashedPassword]
    );

    res.json({
      success: true,
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});
//new login api
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    res.json({
      success: true,
      user: {
        fullName: user.full_name,
        username: user.username,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Verify OTP endpoint
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp, type } = req.body;

    // Validate input
    if (!email || !otp || !type) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and type are required'
      });
    }

    // Get stored OTP data
    const storedOTPData = otpStore.get(email);

    if (!storedOTPData) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this email'
      });
    }

    // Check if OTP is expired
    if (Date.now() > storedOTPData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Check OTP
    if (storedOTPData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Check if OTP type matches
    if (storedOTPData.type !== type) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP type'
      });
    }

    //OTP is valid, remove from store
    otpStore.delete(email);
    console.log(`OTP verified successfully for ${email}`);
    res.json({
        success: true,
        message: 'OTP verified successfully'
    });}
catch(error){
    console.error('Error verifying OTP:', error);
    res.status(500).json({
        success: false,
        message: 'Failed to verify OTP',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
}
});

// Clean up expired OTPs every minute

setInterval(() => {

    const now = Date.now();

    for (const [email, otpData] of otpStore.entries()) {

        if (now > otpData.expiresAt) {

            otpStore.delete(email);

            console.log(` Cleaned up expired OTP for ${email}`);
        }
    }

}, 60000);
//upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { username } = req.body;

    if (!req.file || !username) {
      return res.status(400).json({
        success: false,
        message: 'Invalid upload request'
      });
    }

    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    const userId = userResult.rows[0].id;

    const file = req.file;

    await pool.query(
      `INSERT INTO files (user_id, file_name, file_type, file_path)
       VALUES ($1, $2, $3, $4)`,
      [userId, file.originalname, file.mimetype, file.filename]
    );

    res.json({
      success: true,
      message: 'File uploaded successfully'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
//get
app.get('/api/files/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.json({ success: true, files: [] });
    }

    const userId = userResult.rows[0].id;

    const result = await pool.query(
      'SELECT * FROM files WHERE user_id = $1 ORDER BY uploaded_at DESC',
      [userId]
    );

    res.json({
      success: true,
      files: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});
//dowload/preview
app.get('/api/file/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.query;

    if (!username) {
      return res.status(400).send('Username required');
    }

    
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).send('Unauthorized');
    }

    const userId = userResult.rows[0].id;

    
    const result = await pool.query(
      'SELECT * FROM files WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('File not found or unauthorized');
    }

    const file = result.rows[0];
    const filePath = path.join(__dirname, 'uploads', file.file_path);

    
    res.setHeader(
    "Content-Disposition",
    `attachment; filename="${file.file_name}"`
    );
    res.sendFile(filePath);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching file');
  }
});
//delete
app.delete('/api/file/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.query;

    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ success: false });
    }

    const userId = userResult.rows[0].id;

    const result = await pool.query(
      'SELECT * FROM files WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false });
    }

    const file = result.rows[0];
    const filePath = path.join(__dirname, 'uploads', file.file_path);

    // delete from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // delete from DB
    await pool.query('DELETE FROM files WHERE id = $1', [id]);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Error handling middleware

app.use((error, req, res, next) => {

    console.error('Server Error:', error);

    res.status(500).json({

        success: false,

        message: 'Internal server error',

        error: process.env.NODE_ENV === 'development' ? error.message: undefined

    });

});

//404 handler
app.use((req,res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

//start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║         🚀 SERVER STARTED           ║
╠══════════════════════════════════════╣
║ Port: ${PORT.toString().padEnd(30)} ║
║ Environment: ${(process.env.NODE_ENV || 'development').padEnd(21)} ║
║ Email Service: Gmail${' '.repeat(15)} ║
╚══════════════════════════════════════╝
                
    API Endpoints:
    - GET /api/health
    - POST /api/send-otp
    - POST /api/verify-otp

    Server is ready to handle requests!
    `);
});
