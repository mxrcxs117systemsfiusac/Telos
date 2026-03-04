import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize } from '../models/index.js';
import authRoutes from '../routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;


// Middleware
app.use(cors());
app.use(express.json({ limit: '200mb' })); // Increased limit for large uploads (PDFs, JSONs)
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Auth Routes
app.use('/api/auth', authRoutes);

// Path to data file
const DATA_DIR = path.join(__dirname, '../data');
console.log('Resolved DATA_DIR:', DATA_DIR);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Request Logger
app.use((req, res, next) => {
    const logLine = `${new Date().toISOString()} - ${req.method} ${req.url}`;
    console.log(logLine);
    next();
});

// Serve PDFs and Images statically
app.use('/pdfs', express.static(path.join(DATA_DIR, 'pdfs')));
app.use('/images', express.static(path.join(DATA_DIR, 'images')));
app.use('/album', express.static(path.join(DATA_DIR, 'images', 'album')));

const IMG_DIR = path.join(DATA_DIR, 'images');
const PDF_DIR = path.join(DATA_DIR, 'pdfs');
const ALBUM_DIR = path.join(DATA_DIR, 'images', 'album');

if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });
if (!fs.existsSync(ALBUM_DIR)) fs.mkdirSync(ALBUM_DIR, { recursive: true });

// Image Upload
app.post('/api/settings/upload-image', (req, res) => {
    try {
        const { name, data } = req.body;
        if (!name || !data) {
            return res.status(400).json({ error: 'Missing name or data' });
        }
        const base64Data = data.split(';base64,').pop();
        fs.writeFileSync(path.join(IMG_DIR, name), base64Data, { encoding: 'base64' });
        res.json({ success: true, url: `/images/${name}` });
    } catch (err) {
        console.error('Error uploading Image:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.delete('/api/settings/images/:name', (req, res) => {
    try {
        const name = req.params.name;
        const filePath = path.join(IMG_DIR, name);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

// Album Image Endpoints
app.get('/api/josselin/album', (req, res) => {
    try {
        const files = fs.readdirSync(ALBUM_DIR).filter(f => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(f));
        const images = files.map(name => ({
            name,
            url: `/album/${name}`
        }));
        res.json(images);
    } catch (err) {
        res.json([]);
    }
});

app.post('/api/josselin/album', (req, res) => {
    try {
        const { name, data } = req.body;
        if (!name || !data) return res.status(400).json({ error: 'Missing name or data' });

        const safeName = name
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9.-]/g, '_');

        const uniqueName = `${Date.now()}_${safeName}`;
        const base64Data = data.split(';base64,').pop();
        fs.writeFileSync(path.join(ALBUM_DIR, uniqueName), base64Data, { encoding: 'base64' });
        res.json({ success: true, name: uniqueName, url: `/album/${uniqueName}` });
    } catch (err) {
        console.error('Error uploading album image:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.delete('/api/josselin/album/:name', (req, res) => {
    try {
        const filePath = path.join(ALBUM_DIR, req.params.name);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

// Routes
import financeRoutes from '../routes/finance.js';
import scheduleRoutes from '../routes/schedule.js';
import studyRoutes from '../routes/study.js';
import devotionalRoutes from '../routes/devotional.js';
import programmingRoutes from '../routes/programming.js';
import quotesRoutes from '../routes/quotes.js';
import theologyRoutes from '../routes/theology.js';
import josselinRoutes from '../routes/josselin.js';
import engineeringRoutes from '../routes/engineering.js';

app.use('/api/finance', financeRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/devotional', devotionalRoutes);
app.use('/api/programming', programmingRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/theology', theologyRoutes);
app.use('/api/josselin', josselinRoutes);
app.use('/api/engineering', engineeringRoutes);


// 404 Handler for Debugging
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
});

// Start Server
sequelize.sync().then(() => {
    console.log('Database synced');
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to sync database:', err);
});
