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
            const uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
        }
    })
});

let authToken = process.env.ADMIN_TOKEN || 'orbit-master-key-2026';


const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = process.env.VERCEL ? '/tmp/data' : path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'posts.json');
const projectsFile = path.join(dataDir, 'projects.json');
const clientsFile = path.join(dataDir, 'clients.json');
const clientProjectsFile = path.join(dataDir, 'client_projects.json');
const pricingFile = path.join(dataDir, 'pricing.json');
const messagesFile = path.join(dataDir, 'messages.json');
const testimonialsFile = path.join(dataDir, 'testimonials.json');



// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the current directory (for HTML, CSS, JS)
app.use(express.static(__dirname));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure data directory and posts.json exist
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Copy default files to /tmp/data if on Vercel
if (process.env.VERCEL) {
    const staticDataDir = path.join(__dirname, 'data');
    ['posts.json', 'projects.json', 'clients.json', 'client_projects.json', 'pricing.json', 'messages.json', 'testimonials.json'].forEach(file => {
        const tempPath = path.join(dataDir, file);
        const staticPath = path.join(staticDataDir, file);
        if (!fs.existsSync(tempPath) && fs.existsSync(staticPath)) {
            fs.copyFileSync(staticPath, tempPath);
        }
    });
}
if (!fs.existsSync(dataFile)) {
    // Write 2 default posts corresponding to existing frontend ones
    const defaultPosts = [
        {
            id: '1',
            title: 'The Future of AI in Digital Agencies',
            tag: 'Technology',
            image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
            snippet: 'How artificial intelligence is reshaping frontend paradigms and automation processes globally.',
            timestamp: new Date().toISOString()
        },
        {
            id: '2',
            title: 'Why Glassmorphism is Dominating App Design',
            tag: 'Insights',
            image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
            snippet: 'Explore the psychological effects of modern UI, depth of field blur effects, and user retention strategies.',
            timestamp: new Date(Date.now() - 86400000).toISOString()
        }
    ];
    fs.writeFileSync(dataFile, JSON.stringify(defaultPosts, null, 2));
}

if (!fs.existsSync(projectsFile)) {
    const defaultProjects = [
        {
            id: 'zamclouds-1',
            title: 'Zambia Cloud Programmers Web Redesign',
            category: 'Website Development',
            image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
            liveUrl: 'https://www.zamclouds.com/',
            link: 'https://www.zamclouds.com/',
            description: 'A comprehensive website redesign for Zambia Cloud Programmers, delivering a high-speed, modern platform for tech developers and cloud enthusiasts.',
            problem: 'The community needed a dynamic, mobile-first web presence to showcase cloud developer initiatives, community workshops, and technical training with high performance.',
            solution: 'Crafted a responsive, cloud-architected platform featuring sleek dark-mode aesthetics, streamlined registration flows, and clear documentation links.',
            result: 'Significantly elevated community engagement, increased developer onboarding, and achieved near-instant load speeds.',
            featured: true,
            timestamp: new Date().toISOString()
        },
        {
            id: '1',
            title: 'Fintech Dashboard Redesign',
            category: 'Website Development',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
            liveUrl: 'https://example.com/fintech-dashboard',
            link: 'https://example.com/fintech-dashboard',
            description: 'A complete overhaul of a legacy financial dashboard enhancing user experience and data visualization.',
            problem: 'The client struggled with high user drop-off due to poor navigation and overly complex statistical tables.',
            solution: 'We simplified the architecture, implemented dark mode aesthetics, and integrated interactive Chart.js graphs.',
            result: 'User retention vastly improved by 40% and daily login durations doubled over the first quarter.',
            featured: true,
            timestamp: new Date().toISOString()
        },
        {
            id: '2',
            title: 'E-commerce Brand Identity',
            category: 'Graphic Design',
            image: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1200&q=80',
            liveUrl: 'https://www.behance.net/gallery/ecommerce-branding',
            link: 'https://www.behance.net/gallery/ecommerce-branding',
            description: 'Modern branding and visual identity system engineered for a sustainable luxury fashion house.',
            problem: 'The client needed a logo that communicated both luxury and environmental responsibility.',
            solution: 'We created a minimalist organic leaf motif with premium gold accents.',
            result: 'The brand successfully launched with 10k pre-orders in the first week.',
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

if (!fs.existsSync(messagesFile)) {
    fs.writeFileSync(messagesFile, JSON.stringify([], null, 2));
}

if (!fs.existsSync(testimonialsFile)) {
    fs.writeFileSync(testimonialsFile, JSON.stringify([], null, 2));
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
    const envUser = (process.env.ADMIN_USER || 'admin').trim();
    const envPass = (process.env.ADMIN_PASS || 'orbit2026').trim();

    if (username && password && username.trim() === envUser && password.trim() === envPass) {
        // Use a stable token if not provided in env to prevent logout on restart
        return res.json({ success: true, token: authToken });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
});

const NOTIFICATION_RECIPIENT = process.env.NOTIFICATION_EMAIL || 'orbitnewsblog@gmail.com';

function createTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.EMAIL_USER || 'orbitnewsblog@gmail.com';
    const pass = process.env.EMAIL_PASS || '';

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
            user,
            pass
        }
    });
}

async function sendNotificationEmail({ subject, text, html, replyTo }) {
    if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your-google-app-password') {
        console.log(`[SMTP Queued] Notification for ${NOTIFICATION_RECIPIENT}: "${subject}" (Add EMAIL_PASS to .env for live dispatch)`);
        return false;
    }
    try {
        const transporter = createTransporter();
        await transporter.sendMail({
            from: `"Orbit Tech" <${process.env.EMAIL_USER || 'orbitnewsblog@gmail.com'}>`,
            to: NOTIFICATION_RECIPIENT,
            replyTo: replyTo || process.env.EMAIL_USER || 'orbitnewsblog@gmail.com',
            subject: subject,
            text: text,
            html: html || undefined
        });
        console.log(`[SMTP Success] Email delivered to ${NOTIFICATION_RECIPIENT}: ${subject}`);
        return true;
    } catch (err) {
        console.error('[SMTP Error] Email delivery failed:', err.message);
        return false;
    }
}

// POST: Contact form endpoint
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, service, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const newMessage = {
        id: Date.now().toString(),
        name,
        email,
        phone: phone || 'N/A',
        service: service || 'N/A',
        message,
        timestamp: new Date().toISOString(),
        read: false
    };

    try {
        const messages = fs.existsSync(messagesFile)
            ? JSON.parse(fs.readFileSync(messagesFile, 'utf8') || '[]')
            : [];
        messages.unshift(newMessage);
        fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
    } catch (saveError) {
        console.error('Message save error:', saveError);
        return res.status(500).json({ error: 'Failed to save message' });
    }

    // Attempt SMTP delivery to orbitnewsblog@gmail.com
    await sendNotificationEmail({
        subject: `New Project Inquiry from ${name} (${service || 'General'})`,
        replyTo: email,
        text: `You have received a new inquiry on Orbit Tech!\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nService Needed: ${service || 'General Inquiry'}\n\nMessage:\n${message}\n\nSubmitted at: ${new Date().toLocaleString()}`
    });

    return res.status(200).json({ success: true, message: 'Message sent successfully' });
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
            document.fillColor('#b8860b').fontSize(10).font('Helvetica-Bold')
                    .text('To pay, please contact us on WhatsApp: +234 701 076 5268 or email: orbitnewsblog@gmail.com', 50, footerTop + 30, { align: 'center' });
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
            document.fillColor('#b8860b').fontSize(10).font('Helvetica-Bold')
                    .text('To pay, please contact us on WhatsApp: +234 701 076 5268 or email: orbitnewsblog@gmail.com', 50, footerTop + 30, { align: 'center' });
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
        const posts = JSON.parse(data || '[]').map(post => ({
            ...post,
            content: post.content || post.snippet || ''
        }));
        res.json(posts);
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
        content: req.body.content || req.body.snippet,
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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    fs.readFile(projectsFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading projects:', err);
            return res.status(500).json({ error: 'Failed to read projects data' });
        }
        res.json(JSON.parse(data || '[]'));
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
        liveUrl: req.body.liveUrl || req.body.link || '',
        link: req.body.liveUrl || req.body.link || '',
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
// MESSAGES API ENDPOINTS (Admin)
// ==========================================

// GET: Fetch all messages
app.get('/api/admin/messages', requireAuth, (req, res) => {
    fs.readFile(messagesFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read messages' });
        res.json(JSON.parse(data || '[]'));
    });
});

// DELETE: Remove a message by ID
app.delete('/api/admin/messages/:id', requireAuth, (req, res) => {
    const messageId = req.params.id;

    fs.readFile(messagesFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed' });

        let messages = JSON.parse(data || '[]');
        messages = messages.filter(msg => msg.id !== messageId);

        fs.writeFile(messagesFile, JSON.stringify(messages, null, 2), (writeErr) => {
            if (writeErr) return res.status(500).json({ error: 'Failed to delete message' });
            res.status(200).json({ message: 'Message deleted successfully' });
        });
    });
});

// PUT: Mark message as read
app.put('/api/admin/messages/:id/read', requireAuth, (req, res) => {
    const messageId = req.params.id;

    fs.readFile(messagesFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed' });

        let messages = JSON.parse(data || '[]');
        const index = messages.findIndex(msg => msg.id === messageId);
        if (index !== -1) {
            messages[index].read = true;
            fs.writeFile(messagesFile, JSON.stringify(messages, null, 2), (writeErr) => {
                if (writeErr) return res.status(500).json({ error: 'Failed' });
                res.status(200).json({ message: 'Message marked as read' });
            });
        } else {
            res.status(404).json({ error: 'Message not found' });
        }
    });
});


// ==========================================
// TESTIMONIALS API ENDPOINTS
// ==========================================

// GET: Fetch all testimonials
app.get('/api/testimonials', (req, res) => {
    fs.readFile(testimonialsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed' });
        res.json(JSON.parse(data || '[]'));
    });
});

// POST: Add new testimonial (Admin)
app.post('/api/admin/testimonials', requireAuth, upload.single('video'), (req, res) => {
    const { name, role, text, type, videoUrl } = req.body;
    
    fs.readFile(testimonialsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed' });
        const testimonials = JSON.parse(data || '[]');
        
        const newTestimonial = {
            id: Date.now().toString(),
            name,
            role,
            text,
            type, // 'text' or 'video'
            videoUrl: req.file ? `/uploads/${req.file.filename}` : (videoUrl || ''),
            timestamp: new Date().toISOString()
        };
        
        testimonials.unshift(newTestimonial);
        fs.writeFile(testimonialsFile, JSON.stringify(testimonials, null, 2), writeErr => {
            if (writeErr) return res.status(500).json({ error: 'Failed' });
            res.status(201).json(newTestimonial);
        });
    });
});

// DELETE: Remove testimonial (Admin)
app.delete('/api/admin/testimonials/:id', requireAuth, (req, res) => {
    const id = req.params.id;
    fs.readFile(testimonialsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed' });
        let testimonials = JSON.parse(data || '[]');
        testimonials = testimonials.filter(t => t.id !== id);
        fs.writeFile(testimonialsFile, JSON.stringify(testimonials, null, 2), writeErr => {
            if (writeErr) return res.status(500).json({ error: 'Failed' });
            res.json({ success: true });
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
    const { clientId, projectName, status, progress, startDate, dueDate, projectSummary, nextStep, milestones } = req.body;

    const newProject = {
        id: Date.now().toString(),
        clientId,
        projectName,
        status: status || 'Pending',
        progress: progress || 0,
        startDate: startDate || '',
        dueDate: dueDate || '',
        projectSummary: projectSummary || '',
        nextStep: nextStep || '',
        milestones: Array.isArray(milestones) ? milestones : [],
        files: [],
        timestamp: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
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
    const { status, progress, startDate, dueDate, projectSummary, nextStep, milestones } = req.body;

    fs.readFile(clientProjectsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed' });
        let projects = JSON.parse(data || '[]');
        const index = projects.findIndex(p => p.id === projectId);
        if (index === -1) return res.status(404).json({ error: 'Project not found' });

        if (status) projects[index].status = status;
        if (progress !== undefined) projects[index].progress = Number(progress);
        if (startDate !== undefined) projects[index].startDate = startDate;
        if (dueDate !== undefined) projects[index].dueDate = dueDate;
        if (projectSummary !== undefined) projects[index].projectSummary = projectSummary;
        if (nextStep !== undefined) projects[index].nextStep = nextStep;
        if (milestones !== undefined) projects[index].milestones = Array.isArray(milestones) ? milestones : [];
        projects[index].lastUpdated = new Date().toISOString();

        fs.writeFile(clientProjectsFile, JSON.stringify(projects, null, 2), err => {
            if (err) return res.status(500).json({ error: 'Failed' });
            res.json(projects[index]);
        });
    });
});

// DELETE: Remove a client project assignment
app.delete('/api/admin/client-projects/:id', requireAuth, (req, res) => {
    const id = req.params.id;
    fs.readFile(clientProjectsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed' });
        let projects = JSON.parse(data || '[]');
        projects = projects.filter(p => p.id !== id);
        fs.writeFile(clientProjectsFile, JSON.stringify(projects, null, 2), writeErr => {
            if (writeErr) return res.status(500).json({ error: 'Failed' });
            res.json({ success: true });
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
                
                // Notify admin via SMTP
                sendNotificationEmail({
                    subject: `[New Client Account] ${username} registered on Orbit Tech`,
                    text: `A new client has created an account on Orbit Tech!\n\nUsername: ${username}\nEmail: ${email || 'N/A'}\nDate: ${new Date().toLocaleString()}\n\nThis client is now listed in the Admin Portal under Client Accounts.`
                });

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

    if (!newPricing || typeof newPricing !== 'object' || !newPricing.services || typeof newPricing.exchangeRate !== 'number') {
        console.error('Invalid pricing payload received:', newPricing);
        return res.status(400).json({ error: 'Invalid pricing payload' });
    }

    try {
        fs.writeFileSync(pricingFile, JSON.stringify(newPricing, null, 2));
        return res.json({ success: true, message: 'Pricing updated successfully' });
    } catch (err) {
        console.error('Pricing save error:', err);
        return res.status(500).json({ error: 'Failed to save pricing' });
    }
});

// GET: Client Dashboard Projects (Only returns their assigned projects)
app.get('/api/client/dashboard', requireClientAuth, (req, res) => {
    fs.readFile(clientProjectsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        const projects = JSON.parse(data || '[]').map(project => ({
            ...project,
            projectSummary: project.projectSummary || '',
            nextStep: project.nextStep || '',
            startDate: project.startDate || '',
            dueDate: project.dueDate || '',
            milestones: Array.isArray(project.milestones) ? project.milestones : [],
            files: Array.isArray(project.files) ? project.files : [],
            lastUpdated: project.lastUpdated || project.timestamp
        }));
        const myProjects = projects.filter(p => p.clientId === req.client.id);
        res.json(myProjects);
    });
});

// DELETE: Client Cancel/Delete Project
app.delete('/api/client/projects/:id', requireClientAuth, (req, res) => {
    const projectId = req.params.id;

    fs.readFile(clientProjectsFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        let projects = JSON.parse(data || '[]');
        const projectIndex = projects.findIndex(p => p.id === projectId && p.clientId === req.client.id);

        if (projectIndex === -1) {
            return res.status(404).json({ error: 'Project not found or unauthorized' });
        }

        const project = projects[projectIndex];
        project.status = 'Cancelled by Client';
        project.cancelledAt = new Date().toISOString();
        project.cancelledByClient = true;
        project.lastUpdated = new Date().toISOString();

        fs.writeFile(clientProjectsFile, JSON.stringify(projects, null, 2), writeErr => {
            if (writeErr) return res.status(500).json({ error: 'Failed to update project' });

            // Notify Admin via Email
            sendNotificationEmail({
                subject: `[Client Cancellation Alert] ${project.projectName} cancelled by client`,
                text: `Client "${req.client.username}" has cancelled their project "${project.projectName}" (ID: ${projectId}) from their dashboard on ${new Date().toLocaleString()}.\n\nThis is now flagged in the Admin Portal under Client Projects.`
            });

            res.json({ success: true, message: 'Project cancelled successfully', project });
        });
    });
});

// ============ AI ASSISTANT ENDPOINT (SIMULATED) ============
app.post('/api/ask-ai', (req, res) => {
    const question = req.body.question || req.body.message;
    if (!question) return res.status(400).json({ error: 'No question provided' });

    const q = question.toLowerCase();
    
    // Helper function to match whole words or key phrases
    const hasWord = (wordsArray) => {
        return wordsArray.some(w => {
            const regex = new RegExp(`\\b${w}\\b`, 'i');
            return regex.test(q);
        });
    };
    
    // Simulate AI processing delay
    setTimeout(() => {
        let answer = "I'm not quite sure about that. Could you please rephrase your question or reach out via WhatsApp at +234 701 076 5268 or email us at orbitnewsblog@gmail.com?";

        if (hasWord(['ceo', 'founder', 'oludare', 'enoch', 'boss', 'leader'])) {
            answer = "**Oludare Enoch** is the Founder & Lead Tech Visionary (CEO) of Orbit Tech. With a passion for digital innovation and scalable tech structures, Enoch founded Orbit Tech to bridge the gap between creative design and sophisticated backend engineering. You can connect with him directly on [LinkedIn](https://linkedin.com/in/oludare-enoch-3a5982326) or via our footer link 'Meet the CEO'.";
        } 
        else if (hasWord(['location', 'headquarters', 'headquarter', 'where', 'country', 'office', 'nigeria'])) {
            answer = "Orbit Tech is proudly based in **Headquarters Nigeria**, delivering world-class digital solutions to innovative businesses locally and worldwide across the UK, US, Zambia, and beyond!";
        }
        else if (hasWord(['upwork', 'freelance'])) {
            answer = "You can view Oludare Enoch's verified profile and hire Orbit Tech directly on Upwork here: [Orbit Tech on Upwork](https://www.upwork.com/freelancers/~01afa95ce278481982).";
        }
        else if (hasWord(['facebook'])) {
            answer = "Connect with us on Facebook here: [Enoch A. Oludare / Orbit Tech on Facebook](https://www.facebook.com/people/Enoch-A-Oludare/61590213167526/#).";
        }
        else if (hasWord(['tiktok'])) {
            answer = "Follow our latest tech updates and design demos on TikTok: [@orbit_tech on TikTok](https://www.tiktok.com/@orbit_tech?is_from_webapp=1&sender_device=pc).";
        }
        else if (hasWord(['whatsapp', 'phone', 'call', 'chat'])) {
            answer = "You can chat with Orbit Tech directly on WhatsApp at **[+234 701 076 5268](https://wa.me/+2347010765268)** for instant consultations, project negotiations, and rapid support!";
        }
        else if (hasWord(['contact', 'email', 'reach', 'touch'])) {
            answer = "You can reach us directly:\n- **Email:** orbitnewsblog@gmail.com\n- **WhatsApp:** [+234 701 076 5268](https://wa.me/+2347010765268)\n- **Location:** Headquarters Nigeria\n- **Upwork:** [Enoch on Upwork](https://www.upwork.com/freelancers/~01afa95ce278481982)\nOr submit a message through the 'Contact Us' form below!";
        }
        else if (hasWord(['app', 'install', 'pwa', 'phone', 'apk', 'mobile app'])) {
            answer = "Yes! Orbit Tech is a Progressive Web App (PWA). You can install it on your Android or iPhone directly from your browser menu ('Add to Home Screen') and it will launch as a native app with our gold logo icon!";
        }
        else if (hasWord(['cost', 'price', 'pricing', 'rate', 'naira', 'dollar', 'estimate', 'estimator', 'how much'])) {
            answer = "Our service pricing is transparent and flexible (in Naira with automatic USD conversion):\n- **Web Development:** Basic from ₦80K ($57), Standard ₦150K ($107), Premium ₦250K ($179)\n- **Page Setup & Verification:** Basic from ₦50K ($36)\n- **Social Media Management:** Basic from ₦80K ($57)\n- **ERP Softwares:** Basic from ₦250K ($179)\n- **Graphics Design:** Basic from ₦8K ($6)\n- **AI & Automation:** Basic from ₦75K ($54)\n- **Mobile App Development:** Basic from ₦250K ($179)\nUse our **Project Estimator** on the homepage to toggle NGN/USD and get an instant quote!";
        }
        else if (hasWord(['graphic', 'graphics', 'design', 'logo', 'flyer', 'banner'])) {
            answer = "Our **Graphics Design** packages start at **₦8,000 (~$6)** for basic branding elements, up to **₦45,000** for comprehensive identity kits. We craft visually arresting, brand-centric designs that build authority and trust.";
        }
        else if (hasWord(['web', 'website', 'develop', 'development', 'software', 'site'])) {
            answer = "We specialize in **Web & Software Development**! Starting at **₦80,000 (Basic)**, **₦150,000 (Standard)**, and **₦250,000 (Premium)**. We build ultra-fast, modern, responsive websites with interactive features and seamless backend integrations.";
        }
        else if (hasWord(['page setup', 'setup', 'verification'])) {
            answer = "Our **Page Setup** service starts from **₦50,000 (~$36)**. We configure your social & business assets, optimize bio and SEO keywords, and ensure full professional compliance.";
        }
        else if (hasWord(['social media', 'social', 'instagram', 'facebook page'])) {
            answer = "Our **Social Media Management** service starts from **₦80,000 (~$57)**. We handle creative content production, scheduling, analytics, and targeted audience engagement to drive real business growth.";
        }
        else if (hasWord(['erp', 'inventory', 'enterprise'])) {
            answer = "Our **ERP Softwares & System Structuring** starts from **₦250,000 (~$179)**. We organize your business operations, automate workflows, and connect internal databases for complete efficiency.";
        }
        else if (hasWord(['ai', 'automation', 'pabbly', 'zapier', 'bot', 'workflow'])) {
            answer = "Our **AI & Automation** workflows eliminate tedious manual tasks using tools like Pabbly, Zapier, custom AI agents, and CRM syncs. Starting at **₦75,000 (~$54)**.";
        }
        else if (hasWord(['service', 'services', 'offer', 'do you do', 'what do you'])) {
            answer = "Orbit Tech provides full-stack digital transformation services:\n1. **Web & Software Development**\n2. **Page Setup & Optimization**\n3. **Social Media Management**\n4. **ERP Softwares**\n5. **Graphics Design & Branding**\n6. **AI & Automation Pipelines**\n7. **Mobile App Development**\n8. **Tech Consultation & IT Strategy**";
        } 
        else if (hasWord(['sample', 'projects', 'portfolio', 'work', 'zamclouds', 'zambia'])) {
            answer = "Check out our recent work in the **Projects** section! A featured sample is the **Zambia Cloud Programmers Web Redesign** ([zamclouds.com](https://www.zamclouds.com/)), alongside our Fintech Dashboard and E-commerce Brand systems. You can click 'View Projects' on the homepage or 'View All Projects' for full case studies.";
        }
        else if (hasWord(['time', 'timeline', 'long', 'duration', 'weeks'])) {
            answer = "Most standard web and digital projects take **2 to 4 weeks** from design to deployment. Smaller tasks like graphic design or page setup are completed in **2 to 5 days**.";
        } 
        else if (hasWord(['portal', 'client', 'account', 'cancel', 'delete', 'dashboard'])) {
            answer = "Existing clients can access the **Client Portal** to track real-time progress, milestones, and deliverables. Clients can also easily cancel or request project deletion directly from their dashboard at any time.";
        } 
        else if (hasWord(['orbit tech', 'company', 'about', 'revolution'])) {
            answer = "**Orbit Tech** is your Agent of Revolution! We are a Nigeria-headquartered tech company providing cutting-edge web development, sophisticated AI automation, and premium tech workflows tailored for modern business growth.";
        }
        else if (hasWord(['hello', 'hi', 'hey', 'greetings', 'morning', 'afternoon'])) {
            answer = "Hello! I'm the Orbit Tech Virtual Assistant. How can I help you today? You can ask about our services, pricing in Naira/Dollars, CEO Oludare Enoch, portfolio samples, or how to get started!";
        }

        return res.json({ answer });
    }, 800);
});

// Start Server
if (process.env.VERCEL) {
    module.exports = app;
} else {
    app.listen(PORT, () => {
        console.log(`Orbit Tech Server running at http://localhost:${PORT}`);
    });
}

