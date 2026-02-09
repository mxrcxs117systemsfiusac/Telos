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
app.use(express.json({ limit: '50mb' })); // Increased limit for large uploads (PDFs, JSONs)
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

const IMG_DIR = path.join(DATA_DIR, 'images');
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

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

// Routes
import financeRoutes from '../routes/finance.js';
import scheduleRoutes from '../routes/schedule.js';
import studyRoutes from '../routes/study.js';
import devotionalRoutes from '../routes/devotional.js';
import programmingRoutes from '../routes/programming.js';

app.use('/api/finance', financeRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/devotional', devotionalRoutes);
app.use('/api/programming', programmingRoutes);


// Start Server
sequelize.sync().then(() => {
    console.log('Database synced');
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to sync database:', err);
});
