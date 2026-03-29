require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = path.join(__dirname, 'uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
        }
    })
});

let authToken = null;

const app = express();
const PORT = process.env.PORT || 3000;
const dataFile = path.join(__dirname, 'data', 'posts.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the current directory (for HTML, CSS, JS)
app.use(express.static(__dirname));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure data directory and posts.json exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(dataFile)) {
    // Write 2 default posts corresponding to existing frontend ones
    const defaultPosts = [
        {
            id: '1',
            title: 'The Future of AI in Digital Agencies',
            tag: 'Technology',
            image: 'assets/blog_1.png',
            snippet: 'How artificial intelligence is reshaping frontend paradigms and automation processes globally.',
            timestamp: new Date().toISOString()
        },
        {
            id: '2',
            title: 'Why Glassmorphism is Dominating App Design',
            tag: 'Insights',
            image: 'assets/blog_2.png',
            snippet: 'Explore the psychological effects of modern UI, depth of field blur effects, and user retention strategies.',
            timestamp: new Date(Date.now() - 86400000).toISOString()
        }
    ];
    fs.writeFileSync(dataFile, JSON.stringify(defaultPosts, null, 2));
}

// API Routes

// Middleware to protect routes
const requireAuth = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token && authToken && token === `Bearer ${authToken}`) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
};

// POST: Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        authToken = Date.now().toString() + Math.random().toString(36).substring(2);
        return res.json({ success: true, token: authToken });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
});

// POST: Contact form endpoint
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, service, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: `New Quote Request from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nService Needed: ${service || 'N/A'}\n\nMessage:\n${message}`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// GET: Fetch all posts
app.get('/api/posts', (req, res) => {
    fs.readFile(dataFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading posts:', err);
            return res.status(500).json({ error: 'Failed to read posts data' });
        }
        res.json(JSON.parse(data));
    });
});

// POST: Add a new post
app.post('/api/posts', requireAuth, upload.single('image'), (req, res) => {
    let imageUrl = 'https://placehold.co/400x250/1a1a1a/FFD700?text=Tech+Post';
    
    // If a file was uploaded, use the new path
    if (req.file) {
        imageUrl = 'uploads/' + req.file.filename;
    }

    const newPost = {
        id: Date.now().toString(),
        title: req.body.title,
        tag: req.body.tag,
        image: imageUrl,
        snippet: req.body.snippet,
        timestamp: new Date().toISOString()
    };

    fs.readFile(dataFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed' });
        
        const posts = JSON.parse(data);
        posts.unshift(newPost); // Add to the top
        
        fs.writeFile(dataFile, JSON.stringify(posts, null, 2), (writeErr) => {
            if (writeErr) return res.status(500).json({ error: 'Failed to save post' });
            res.status(201).json(newPost);
        });
    });
});

// DELETE: Remove a post by ID
app.delete('/api/posts/:id', requireAuth, (req, res) => {
    const postId = req.params.id;

    fs.readFile(dataFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed' });

        let posts = JSON.parse(data);
        // Filter out the post with the matching ID
        posts = posts.filter(post => post.id !== postId);

        fs.writeFile(dataFile, JSON.stringify(posts, null, 2), (writeErr) => {
            if (writeErr) return res.status(500).json({ error: 'Failed to delete post' });
            res.status(200).json({ message: 'Post deleted successfully' });
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Orbit Tech Server running at http://localhost:${PORT}`);
});
