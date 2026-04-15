require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-orbit-client-key';

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
const projectsFile = path.join(__dirname, 'data', 'projects.json');
const clientsFile = path.join(__dirname, 'data', 'clients.json');
const clientProjectsFile = path.join(__dirname, 'data', 'client_projects.json');
const pricingFile = path.join(__dirname, 'data', 'pricing.json');

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

if (!fs.existsSync(projectsFile)) {
    const defaultProjects = [
        {
            id: '1',
            title: 'Fintech Dashboard Redesign',
            category: 'Website Development',
            image: 'https://placehold.co/800x500/1a1a1a/FFD700?text=Fintech+Mockup',
            description: 'A complete overhaul of a legacy financial dashboard enhancing user experience and data visualization.',
            problem: 'The client struggled with high user drop-off due to poor navigation and overly complex statistical tables.',
            solution: 'We simplified the architecture, implemented dark mode aesthetics, and integrated interactive Chart.js graphs.',
            result: 'User retention vastly improved by 40% and daily login durations doubled over the first quarter.',
            featured: true,
            timestamp: new Date().toISOString()
        }
    ];
    fs.writeFileSync(projectsFile, JSON.stringify(defaultProjects, null, 2));
}

if (!fs.existsSync(clientsFile)) {
    fs.writeFileSync(clientsFile, JSON.stringify([], null, 2));
}

if (!fs.existsSync(clientProjectsFile)) {
    fs.writeFileSync(clientProjectsFile, JSON.stringify([], null, 2));
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
    const envUser = (process.env.ADMIN_USER || '').trim();
    const envPass = (process.env.ADMIN_PASS || '').trim();

    if (username && password && username.trim() === envUser && password.trim() === envPass) {
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
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
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

// POST: Send Proposal endpoint
app.post('/api/send-proposal', requireAuth, async (req, res) => {
    const { companyRc, clientName, clientEmail, projectTitle, budget, projectScope } = req.body;

    if (!clientName || !clientEmail || !projectTitle || !budget || !projectScope) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const htmlContent = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <div style="text-align: center; border-bottom: 2px solid #FFD700; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="color: #1a1a1a; margin: 0;">Orbit Tech</h1>
                <p style="color: #888; margin: 5px 0;">Official Project Proposal</p>
                <div style="display: inline-block; background: #fdfaf0; color: #b8860b; padding: 5px 15px; border-radius: 20px; font-size: 0.9em; font-weight: bold; border: 1px solid #FFD700;">
                    &#10003; Verified Business | CAC RC: ${companyRc || '9385842'}
                </div>
            </div>
            
            <p>Dear <strong>${clientName}</strong>,</p>
            <p>Thank you for considering Orbit Tech. We are pleased to present our official proposal for your project.</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FFD700;">
                <h3 style="margin-top: 0; color: #333;">Project Details</h3>
                <p><strong>Title:</strong> ${projectTitle}</p>
                <p><strong>Proposed Budget:</strong> ${budget}</p>
                <h4 style="margin-bottom: 5px; color: #333;">Scope of Work:</h4>
                <p style="white-space: pre-wrap; margin-top: 5px; color: #555;">${projectScope}</p>
            </div>
            
            <p>Our team at Orbit Tech guarantees high-quality delivery, adherence to timelines, and professional support. As a verified and registered business, we ensure absolute transparency, maximum security, and trustworthiness for all our clients.</p>
            
            <p>To move forward, please reply directly to this email, and we will prepare the necessary agreements.</p>
            
            <div style="margin-top: 30px; font-size: 0.8em; color: #777; border-top: 1px solid #ddd; padding-top: 10px; text-align: center;">
                <p><strong>Orbit Tech</strong><br>
                <em>Innovating the Future of Tech.</em></p>
                <p style="font-size: 0.85em; color: #aaa;">This is an automated formal proposal from Orbit Tech.</p>
            </div>
        </div>
        `;

        const mailOptions = {
            from: `"Orbit Tech" <${process.env.EMAIL_USER}>`,
            to: clientEmail,
            subject: `Project Proposal: ${projectTitle} - Orbit Tech`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Proposal sent successfully' });
    } catch (error) {
        console.error('Proposal Email error:', error);
        res.status(500).json({ error: 'Failed to send proposal' });
    }
});

// POST: Send Invoice endpoint
app.post('/api/send-invoice', requireAuth, async (req, res) => {
    const { companyRc, clientName, clientEmail, description, amount, dueDate } = req.body;

    if (!clientName || !clientEmail || !description || !amount || !dueDate) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const invoiceNumber = 'INV-' + Math.floor(100000 + Math.random() * 900000);
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const htmlContent = `
        <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background-color: #1a1a1a; padding: 30px; text-align: center; border-bottom: 4px solid #FFD700;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">ORBIT TECH</h1>
                <p style="color: #cccccc; margin: 5px 0 0 0; font-size: 14px;">Official Billing Invoice</p>
            </div>
            
            <div style="padding: 30px;">
                <!-- Verified Badge -->
                <div style="background-color: #fcf9e8; color: #b8860b; padding: 10px 15px; border-radius: 4px; font-size: 13px; font-weight: bold; border: 1px solid #FFD700; display: inline-block; margin-bottom: 25px;">
                    <span style="margin-right: 5px;">&#10004;</span> Verified Business | CAC RC: ${companyRc || '9385842'}
                </div>
                
                <!-- Intro -->
                <p style="color: #333333; font-size: 16px; line-height: 1.5; margin-top: 0;">Dear <strong>${clientName}</strong>,</p>
                <p style="color: #555555; font-size: 15px; line-height: 1.5; margin-bottom: 25px;">Thank you for choosing Orbit Tech. Please find the details of your requested service bill below.</p>
                
                <!-- Invoice Info -->
                <table style="width: 100%; margin-bottom: 20px; font-size: 14px; color: #555555;">
                    <tr>
                        <td style="padding-bottom: 5px;"><strong>Invoice No:</strong> ${invoiceNumber}</td>
                        <td style="text-align: right; padding-bottom: 5px;"><strong>Date:</strong> ${currentDate}</td>
                    </tr>
                    <tr>
                        <td><strong>Status:</strong> <span style="color: #d9534f; font-weight: bold;">Due</span></td>
                        <td style="text-align: right;"><strong>Due Date:</strong> ${dueDate}</td>
                    </tr>
                </table>
                
                <!-- Bill Table -->
                <div style="border: 1px solid #eeeeee; border-radius: 6px; overflow: hidden; margin-bottom: 25px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background-color: #f7f7f7; border-bottom: 2px solid #FFD700;">
                            <th style="padding: 12px 15px; text-align: left; color: #1a1a1a; font-size: 14px;">Service Description</th>
                            <th style="padding: 12px 15px; text-align: right; color: #1a1a1a; font-size: 14px; width: 120px;">Amount</th>
                        </tr>
                        <tr>
                            <td style="padding: 15px; color: #444444; font-size: 15px; border-bottom: 1px solid #eeeeee;">${description}</td>
                            <td style="padding: 15px; text-align: right; color: #1a1a1a; font-weight: 600; font-size: 15px; border-bottom: 1px solid #eeeeee;">${amount}</td>
                        </tr>
                        <tr style="background-color: #fafafa;">
                            <td style="padding: 15px; text-align: right; color: #555555; font-size: 14px;"><strong>Total Amount Due:</strong></td>
                            <td style="padding: 15px; text-align: right; color: #b8860b; font-size: 18px; font-weight: bold;">${amount}</td>
                        </tr>
                    </table>
                </div>
                
                <!-- Footer Info -->
                <p style="color: #666666; font-size: 14px; line-height: 1.5; text-align: center; margin: 30px 0 0 0;">
                    Please find a structured PDF copy of this bill attached for your official records. If you have any questions regarding this invoice, simply reply to this email.
                </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="color: #1a1a1a; font-weight: bold; margin: 0 0 5px 0; font-size: 14px;">Orbit Tech</p>
                <p style="color: #888888; margin: 0; font-size: 12px;">Innovating the Future of Tech.</p>
            </div>
        </div>
        `;

        // Generate Professional PDF Invoice
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            const pdfData = Buffer.concat(buffers);
            const mailOptions = {
                from: `"Orbit Tech" <${process.env.EMAIL_USER}>`,
                to: clientEmail,
                subject: `Billing Invoice: ${description} - Orbit Tech`,
                html: htmlContent,
                attachments: [
                    {
                        filename: `Invoice_${invoiceNumber}.pdf`,
                        content: pdfData
                    }
                ]
            };

            try {
                await transporter.sendMail(mailOptions);
                res.status(200).json({ success: true, message: 'Invoice sent successfully' });
            } catch (err) {
                console.error('Invoice Email Send error:', err);
                res.status(500).json({ error: 'Failed to send invoice' });
            }
        });

        // ================= PROFESSIONAL PDF LAYOUT =================
        const generatePdfLayout = (document, invoiceNo, date, companyNum, cName, cEmail, desc, amt, due) => {
            // Header Background & Title
            document.rect(0, 0, document.page.width, 120).fill('#1a1a1a');
            
            document.fillColor('#FFD700').fontSize(28).font('Helvetica-Bold')
                    .text('ORBIT TECH', 50, 40);
            document.fillColor('#ffffff').fontSize(10).font('Helvetica')
                    .text('INNOVATING THE FUTURE OF TECH', 50, 75);
                    
            document.fillColor('#ffffff').fontSize(32).font('Helvetica-Bold')
                    .text('INVOICE', 0, 40, { align: 'right', width: document.page.width - 50 });
            
            // Verified Badge
            document.rect(50, 140, 250, 25).fill('#fdfaf0').strokeColor('#FFD700').lineWidth(1).stroke();
            document.fillColor('#b8860b').fontSize(10).font('Helvetica-Bold')
                    .text('VERIFIED BUSINESS | CAC RC: ' + (companyNum || '9385842'), 60, 148);

            // Bill To & Invoice Info
            document.fillColor('#777777').fontSize(10).font('Helvetica-Bold').text('BILL TO:', 50, 200);
            document.fillColor('#1a1a1a').fontSize(14).text(cName, 50, 215);
            document.fillColor('#555555').fontSize(10).font('Helvetica').text(cEmail, 50, 235);
            
            // Right Side Info
            const rightColumnX = document.page.width - 250;
            document.fillColor('#777777').fontSize(10).font('Helvetica-Bold').text('INVOICE NUMBER:', rightColumnX, 200);
            document.fillColor('#1a1a1a').fontSize(10).font('Helvetica').text(invoiceNo, rightColumnX, 215);
            
            document.fillColor('#777777').font('Helvetica-Bold').text('DATE OF ISSUE:', rightColumnX, 235);
            document.fillColor('#1a1a1a').font('Helvetica').text(date, rightColumnX, 250);
            
            document.fillColor('#777777').font('Helvetica-Bold').text('DUE DATE:', rightColumnX, 270);
            document.fillColor('#d9534f').font('Helvetica-Bold').text(due, rightColumnX, 285);

            // Table Header
            const tableTop = 350;
            document.rect(50, tableTop, document.page.width - 100, 30).fill('#f7f7f7');
            document.moveTo(50, tableTop + 30).lineTo(document.page.width - 50, tableTop + 30).strokeColor('#FFD700').lineWidth(2).stroke();
            
            document.fillColor('#1a1a1a').fontSize(10).font('Helvetica-Bold')
                    .text('DESCRIPTION', 60, tableTop + 10);
            document.text('AMOUNT', 0, tableTop + 10, { align: 'right', width: document.page.width - 60 });

            // Table Item
            const itemTop = tableTop + 45;
            document.fillColor('#444444').fontSize(12).font('Helvetica')
                    .text(desc, 60, itemTop, { width: 350 });
            document.fillColor('#1a1a1a').font('Helvetica-Bold')
                    .text(amt, 0, itemTop, { align: 'right', width: document.page.width - 60 });
                    
            // Line below item
            document.moveTo(50, itemTop + 40).lineTo(document.page.width - 50, itemTop + 40).strokeColor('#eeeeee').lineWidth(1).stroke();

            // Total Area
            const totalTop = itemTop + 60;
            document.fillColor('#777777').fontSize(12).font('Helvetica-Bold')
                    .text('TOTAL DUE:', rightColumnX - 20, totalTop);
            document.fillColor('#b8860b').fontSize(16)
                    .text(amt, 0, totalTop - 2, { align: 'right', width: document.page.width - 60 });

            // Footer Section
            const footerTop = document.page.height - 100;
            document.moveTo(50, footerTop).lineTo(document.page.width - 50, footerTop).strokeColor('#eeeeee').lineWidth(1).stroke();
            document.fillColor('#777777').fontSize(10).font('Helvetica')
                    .text('Thank you for choosing Orbit Tech.', 50, footerTop + 15, { align: 'center' });
            document.text('If you have any questions, please contact us directly.', 50, footerTop + 30, { align: 'center' });
        };
        
        generatePdfLayout(doc, invoiceNumber, currentDate, companyRc, clientName, clientEmail, description, amount, dueDate);
        doc.end();

    } catch (error) {
        console.error('Invoice Generation error:', error);
        res.status(500).json({ error: 'Failed to generate invoice' });
    }
});

// POST: Download Invoice PDF directly
app.post('/api/download-invoice-pdf', requireAuth, async (req, res) => {
    const { companyRc, clientName, clientEmail, description, amount, dueDate } = req.body;

    if (!clientName || !clientEmail || !description || !amount || !dueDate) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const invoiceNumber = 'INV-' + Math.floor(100000 + Math.random() * 900000);
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoiceNumber}.pdf`);
            res.status(200).send(pdfData);
        });

        // ================= PROFESSIONAL PDF LAYOUT =================
        const generatePdfLayout = (document, invoiceNo, date, companyNum, cName, cEmail, desc, amt, due) => {
            // Header Background & Title
            document.rect(0, 0, document.page.width, 120).fill('#1a1a1a');
            
            document.fillColor('#FFD700').fontSize(28).font('Helvetica-Bold')
                    .text('ORBIT TECH', 50, 40);
            document.fillColor('#ffffff').fontSize(10).font('Helvetica')
                    .text('INNOVATING THE FUTURE OF TECH', 50, 75);
                    
            document.fillColor('#ffffff').fontSize(32).font('Helvetica-Bold')
                    .text('INVOICE', 0, 40, { align: 'right', width: document.page.width - 50 });
            
            // Verified Badge
            document.rect(50, 140, 250, 25).fill('#fdfaf0').strokeColor('#FFD700').lineWidth(1).stroke();
            document.fillColor('#b8860b').fontSize(10).font('Helvetica-Bold')
                    .text('VERIFIED BUSINESS | CAC RC: ' + (companyNum || '9385842'), 60, 148);

            // Bill To & Invoice Info
            document.fillColor('#777777').fontSize(10).font('Helvetica-Bold').text('BILL TO:', 50, 200);
            document.fillColor('#1a1a1a').fontSize(14).text(cName, 50, 215);
            document.fillColor('#555555').fontSize(10).font('Helvetica').text(cEmail, 50, 235);
            
            const rightColumnX = document.page.width - 250;
            document.fillColor('#777777').fontSize(10).font('Helvetica-Bold').text('INVOICE NUMBER:', rightColumnX, 200);
            document.fillColor('#1a1a1a').fontSize(10).font('Helvetica').text(invoiceNo, rightColumnX, 215);
            
            document.fillColor('#777777').font('Helvetica-Bold').text('DATE OF ISSUE:', rightColumnX, 235);
            document.fillColor('#1a1a1a').font('Helvetica').text(date, rightColumnX, 250);
            
            document.fillColor('#777777').font('Helvetica-Bold').text('DUE DATE:', rightColumnX, 270);
            document.fillColor('#d9534f').font('Helvetica-Bold').text(due, rightColumnX, 285);

            // Table Header
            const tableTop = 350;
            document.rect(50, tableTop, document.page.width - 100, 30).fill('#f7f7f7');
            document.moveTo(50, tableTop + 30).lineTo(document.page.width - 50, tableTop + 30).strokeColor('#FFD700').lineWidth(2).stroke();
            
            document.fillColor('#1a1a1a').fontSize(10).font('Helvetica-Bold')
                    .text('DESCRIPTION', 60, tableTop + 10);
            document.text('AMOUNT', 0, tableTop + 10, { align: 'right', width: document.page.width - 60 });

            // Table Item
            const itemTop = tableTop + 45;
            document.fillColor('#444444').fontSize(12).font('Helvetica')
                    .text(desc, 60, itemTop, { width: 350 });
            document.fillColor('#1a1a1a').font('Helvetica-Bold')
                    .text(amt, 0, itemTop, { align: 'right', width: document.page.width - 60 });
                    
            document.moveTo(50, itemTop + 40).lineTo(document.page.width - 50, itemTop + 40).strokeColor('#eeeeee').lineWidth(1).stroke();

            // Total Area
            const totalTop = itemTop + 60;
            document.fillColor('#777777').fontSize(12).font('Helvetica-Bold')
                    .text('TOTAL DUE:', rightColumnX - 20, totalTop);
            document.fillColor('#b8860b').fontSize(16)
                    .text(amt, 0, totalTop - 2, { align: 'right', width: document.page.width - 60 });

            // Footer Section
            const footerTop = document.page.height - 100;
            document.moveTo(50, footerTop).lineTo(document.page.width - 50, footerTop).strokeColor('#eeeeee').lineWidth(1).stroke();
            document.fillColor('#777777').fontSize(10).font('Helvetica')
                    .text('Thank you for choosing Orbit Tech.', 50, footerTop + 15, { align: 'center' });
            document.text('If you have any questions, please contact us directly.', 50, footerTop + 30, { align: 'center' });
        };
        
        generatePdfLayout(doc, invoiceNumber, currentDate, companyRc, clientName, clientEmail, description, amount, dueDate);
        doc.end();

    } catch (error) {
        console.error('Invoice Download Generation error:', error);
        res.status(500).json({ error: 'Failed to generate invoice PDF' });
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

// ==========================================
// PORTFOLIO API ENDPOINTS
// ==========================================

// GET: Fetch all projects
app.get('/api/projects', (req, res) => {
    fs.readFile(projectsFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading projects:', err);
            return res.status(500).json({ error: 'Failed to read projects data' });
        }
        res.json(JSON.parse(data));
    });
});

// POST: Add a new project
app.post('/api/projects', requireAuth, upload.single('image'), (req, res) => {
    let imageUrl = 'https://placehold.co/800x500/1a1a1a/FFD700?text=Project+Media';
    
    if (req.file) {
        imageUrl = 'uploads/' + req.file.filename;
    }

    const isFeatured = req.body.featured === 'true' || req.body.featured === true;

    const newProject = {
        id: Date.now().toString(),
        title: req.body.title,
        category: req.body.category,
        image: imageUrl,
        description: req.body.description,
        problem: req.body.problem,
        solution: req.body.solution,
        result: req.body.result,
        featured: isFeatured,
        timestamp: new Date().toISOString()
    };

    fs.readFile(projectsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed' });
        
        const projects = JSON.parse(data);
        projects.unshift(newProject);
        
        fs.writeFile(projectsFile, JSON.stringify(projects, null, 2), (writeErr) => {
            if (writeErr) return res.status(500).json({ error: 'Failed to save project' });
            res.status(201).json(newProject);
        });
    });
});

// DELETE: Remove a project by ID
app.delete('/api/projects/:id', requireAuth, (req, res) => {
    const projectId = req.params.id;

    fs.readFile(projectsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed' });

        let projects = JSON.parse(data);
        projects = projects.filter(proj => proj.id !== projectId);

        fs.writeFile(projectsFile, JSON.stringify(projects, null, 2), (writeErr) => {
            if (writeErr) return res.status(500).json({ error: 'Failed to delete project' });
            res.status(200).json({ message: 'Project deleted successfully' });
        });
    });
});

// ==========================================
// CLIENT PORTAL & DASHBOARD SYSTEM
// ==========================================

// Middleware for Client JWT
const requireClientAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Missing token' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Malformed token' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.client = user; // Contains client id & username
        next();
    });
};

// ============ ADMIN: MANAGE CLIENTS ============

// GET: List all clients
app.get('/api/admin/clients', requireAuth, (req, res) => {
    fs.readFile(clientsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read clients' });
        const clients = JSON.parse(data);
        // Remove passwords before sending to frontend
        const safeClients = clients.map(c => ({ id: c.id, username: c.username, email: c.email, timestamp: c.timestamp }));
        res.json(safeClients);
    });
});

// POST: Create new client account
app.post('/api/admin/clients', requireAuth, async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newClient = {
            id: Date.now().toString(),
            username: username.trim(),
            password: hashedPassword,
            email: email || '',
            timestamp: new Date().toISOString()
        };

        fs.readFile(clientsFile, 'utf8', (err, data) => {
            if (err) return res.status(500).json({ error: 'Failed' });
            const clients = JSON.parse(data);
            
            // Check if username exists
            if (clients.find(c => c.username === username.trim())) {
                return res.status(400).json({ error: 'Username already exists' });
            }

            clients.push(newClient);
            fs.writeFile(clientsFile, JSON.stringify(clients, null, 2), err => {
                if (err) return res.status(500).json({ error: 'Failed' });
                res.status(201).json({ id: newClient.id, username: newClient.username, email: newClient.email });
            });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error during hash' });
    }
});

// ============ ADMIN: MANAGE CLIENT PROJECTS ============

// GET: All client projects (For Admin Tracking)
app.get('/api/admin/client-projects', requireAuth, (req, res) => {
    fs.readFile(clientProjectsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed' });
        res.json(JSON.parse(data));
    });
});

// POST: Assign project to client
app.post('/api/admin/client-projects', requireAuth, (req, res) => {
    const { clientId, projectName, status, progress } = req.body;

    const newProject = {
        id: Date.now().toString(),
        clientId,
        projectName,
        status: status || 'Pending',
        progress: progress || 0,
        files: [],
        timestamp: new Date().toISOString()
    };

    fs.readFile(clientProjectsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed' });
        const projects = JSON.parse(data);
        projects.push(newProject);
        fs.writeFile(clientProjectsFile, JSON.stringify(projects, null, 2), err => {
            if (err) return res.status(500).json({ error: 'Failed' });
            res.status(201).json(newProject);
        });
    });
});

// PUT: Update client project status/progress
app.put('/api/admin/client-projects/:id', requireAuth, (req, res) => {
    const projectId = req.params.id;
    const { status, progress } = req.body;

    fs.readFile(clientProjectsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed' });
        let projects = JSON.parse(data);
        const index = projects.findIndex(p => p.id === projectId);
        if (index === -1) return res.status(404).json({ error: 'Project not found' });

        if (status) projects[index].status = status;
        if (progress !== undefined) projects[index].progress = Number(progress);

        fs.writeFile(clientProjectsFile, JSON.stringify(projects, null, 2), err => {
            if (err) return res.status(500).json({ error: 'Failed' });
            res.json(projects[index]);
        });
    });
});

// POST: Upload file to client project
app.post('/api/admin/client-projects/:id/files', requireAuth, upload.single('file'), (req, res) => {
    const projectId = req.params.id;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileUrl = 'uploads/' + req.file.filename;
    const originalName = req.file.originalname;

    fs.readFile(clientProjectsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed' });
        let projects = JSON.parse(data);
        const index = projects.findIndex(p => p.id === projectId);
        if (index === -1) return res.status(404).json({ error: 'Project not found' });

        projects[index].files.push({
            id: Date.now().toString(),
            name: originalName,
            url: fileUrl,
            uploadedAt: new Date().toISOString()
        });

        fs.writeFile(clientProjectsFile, JSON.stringify(projects, null, 2), err => {
            if (err) return res.status(500).json({ error: 'Failed' });
            res.json(projects[index]);
        });
    });
});

// ============ CLIENT FACING ROUTES ============

// POST: Client Signup (Self Registration)
app.post('/api/client/signup', async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newClient = {
            id: Date.now().toString(),
            username: username.trim(),
            password: hashedPassword,
            email: email || '',
            timestamp: new Date().toISOString()
        };

        fs.readFile(clientsFile, 'utf8', (err, data) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            const clients = JSON.parse(data);
            
            if (clients.find(c => c.username === username.trim())) {
                return res.status(400).json({ error: 'Username already exists' });
            }

            clients.push(newClient);
            fs.writeFile(clientsFile, JSON.stringify(clients, null, 2), err => {
                if (err) return res.status(500).json({ error: 'Failed to create account' });
                res.status(201).json({ success: true, message: 'Account created successfully' });
            });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error during hash' });
    }
});

// POST: Client Login
app.post('/api/client/login', (req, res) => {
    const { username, password } = req.body;

    fs.readFile(clientsFile, 'utf8', async (err, data) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        const clients = JSON.parse(data);
        
        const client = clients.find(c => c.username === username.trim());
        if (!client) return res.status(401).json({ error: 'Invalid username or password' });

        const validPassword = await bcrypt.compare(password, client.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid username or password' });

        // Generate Client JWT
        const token = jwt.sign({ id: client.id, username: client.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token, client: { username: client.username } });
    });
});

// ============ PRICING SYSTEM ENDPOINTS ============

// GET: Fetch Pricing Info
app.get('/api/pricing', (req, res) => {
    fs.readFile(pricingFile, 'utf8', (err, data) => {
        if (err || !data) return res.status(500).json({ error: 'Failed to read pricing' });
        res.json(JSON.parse(data));
    });
});

// PUT: Update Pricing Info (Admin only)
app.put('/api/admin/pricing', requireAuth, (req, res) => {
    const newPricing = req.body;
    
    fs.writeFile(pricingFile, JSON.stringify(newPricing, null, 2), err => {
        if (err) return res.status(500).json({ error: 'Failed' });
        res.json({ success: true, message: 'Pricing updated successfully' });
    });
});

// GET: Client Dashboard Projects (Only returns their assigned projects)
app.get('/api/client/dashboard', requireClientAuth, (req, res) => {
    fs.readFile(clientProjectsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        const projects = JSON.parse(data);
        const myProjects = projects.filter(p => p.clientId === req.client.id);
        res.json(myProjects);
    });
});

// ============ AI ASSISTANT ENDPOINT (SIMULATED) ============
app.post('/api/ask-ai', (req, res) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'No question provided' });

    const q = question.toLowerCase();
    
    // Helper function to match whole words only to prevent partial matches (e.g. "hi" in "graphic")
    const hasWord = (wordsArray) => {
        return wordsArray.some(w => {
            const regex = new RegExp(`\\b${w}\\b`, 'i');
            return regex.test(q);
        });
    };
    
    // Simulate AI processing delay
    setTimeout(() => {
        let answer = "I'm not quite sure about that. Could you please rephrase your question or use the Contact Us section so a human representative can assist you?";

        if (hasWord(['ceo', 'founder', 'oludare', 'enoch'])) {
            answer = "**Oludare Enoch** is the Founder and Lead Tech Visionary (CEO) of Orbit Tech. He founded the agency to bridge the gap between creative design and sophisticated backend engineering.";
        } 
        else if (hasWord(['graphic', 'graphics', 'design', 'logo', 'branding', 'brand'])) {
            answer = "Yes! We offer premium **Graphic Design & Branding** services. We create visually arresting designs to capture attention, build trust, and align your brand identity perfectly.";
        }
        else if (hasWord(['web', 'website', 'develop', 'development', 'app'])) {
            answer = "Yes! Core to our expertise is **Web Development**. We build custom, scalable, and ultra-fast web applications designed for performance and unparalleled user experiences.";
        }
        else if (hasWord(['ai', 'automation', 'pabbly', 'zapier', 'bot'])) {
            answer = "Absolutely. Our **AI & Automation** services use tools like Pabbly and Zapier to eliminate manual tasks, handle CRM data entry, automatic follow-ups, and more, saving you huge amounts of time.";
        }
        else if (hasWord(['service', 'services', 'offer', 'do you do', 'what do you'])) {
            answer = "We specialize in several digital services:\n- **Web Development**\n- **AI & Automation**\n- **Graphics Design**\n- **Digital Marketing**\n- **Branding**\n- **ERP Softwares**\n- **Social Media Management**\n- **Tech Consultation**";
        } 
        else if (hasWord(['time', 'long', 'duration', 'months', 'weeks'])) {
            answer = "On average, a standard professional agency website takes between **2 to 4 weeks** from the initial consultation to final delivery depending on the complexity of the functionality.";
        } 
        else if (hasWord(['cost', 'price', 'budget', 'much', 'pay'])) {
            answer = "Project costs vary greatly based on scope, technical requirements, and timeline. Please use the **Get a Quote** form to provide details, and we'll send you an official personalized proposal!";
        } 
        else if (hasWord(['contact', 'email', 'phone', 'reach', 'call'])) {
            answer = "You can reach us multiple ways!\n**Phone / WhatsApp:** +234 810 693 2689\n**Email:** hello@orbittech.com.ng\nWe are based in Ado-Ekiti, Nigeria but operate globally.";
        } 
        else if (hasWord(['project', 'status', 'portal', 'dashboard'])) {
            answer = "If you are an existing client, you can log in to our **Client Portal** using the 'Client Portal' button in the navigation menu to track your project's status in real-time.";
        } 
        else if (hasWord(['orbit tech', 'company', 'about'])) {
            answer = "**Orbit Tech** is an elite digital agency focused on propelling bold ideas into reality. We merge creative design with robust technology to craft digital solutions for forward-thinking businesses.";
        }
        else if (hasWord(['hello', 'hi', 'hey', 'greetings', 'morning', 'afternoon'])) {
            answer = "Hello there! I'm the Orbit Tech Virtual Assistant. I can tell you about our services like web development, graphic design, pricing, or our CEO. How can I help you today?";
        }

        return res.json({ answer });
    }, 1200); // 1.2 second simulated delay
});

// Start Server
app.listen(PORT, () => {
    console.log(`Orbit Tech Server running at http://localhost:${PORT}`);
});
