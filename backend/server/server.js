import express from 'express';
import cors from 'cors';
import { sequelize, AlbumImage } from '../models/index.js';
import authRoutes from '../routes/auth.js';
import cloudinary from '../config/cloudinary.js';
import { uploadImage } from '../middleware/upload.js';
import { authenticateToken } from '../middleware/auth.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Auth Routes
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Request Logger
app.use((req, res, next) => {
    const logLine = `${new Date().toISOString()} - ${req.method} ${req.url}`;
    console.log(logLine);
    next();
});

// ── Image Upload (Savings/Wallet image) ──
app.post('/api/settings/upload-image', authenticateToken, uploadImage.single('image'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        // req.file.path = Cloudinary URL, req.file.filename = public_id
        res.json({ success: true, url: req.file.path, public_id: req.file.filename });
    } catch (err) {
        console.error('Error uploading Image:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.delete('/api/settings/images/:publicId', authenticateToken, async (req, res) => {
    try {
        const publicId = decodeURIComponent(req.params.publicId);
        await cloudinary.uploader.destroy(publicId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

// ── Album Image Endpoints (Cloudinary + DB) ──
app.get('/api/josselin/album', authenticateToken, async (req, res) => {
    try {
        const images = await AlbumImage.findAll({
            where: { user_id: req.user.id },
            order: [['createdAt', 'ASC']]
        });
        res.json(images.map(img => ({ id: img.id, name: img.name, url: img.url, public_id: img.public_id })));
    } catch (err) {
        res.json([]);
    }
});

app.post('/api/josselin/album', authenticateToken, uploadImage.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const record = await AlbumImage.create({
            user_id: req.user.id,
            name: req.file.originalname || 'album_image',
            url: req.file.path,
            public_id: req.file.filename
        });

        res.json({ success: true, id: record.id, name: record.name, url: record.url, public_id: record.public_id });
    } catch (err) {
        console.error('Error uploading album image:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.delete('/api/josselin/album/:id', authenticateToken, async (req, res) => {
    try {
        const image = await AlbumImage.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!image) return res.status(404).json({ error: 'Image not found' });

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(image.public_id);
        // Delete from DB
        await image.destroy();

        res.json({ success: true });
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
import josselinPlanRoutes from '../routes/josselinPlan.js';

app.use('/api/finance', financeRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/devotional', devotionalRoutes);
app.use('/api/programming', programmingRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/theology', theologyRoutes);
app.use('/api/josselin', josselinRoutes);
app.use('/api/engineering', engineeringRoutes);
app.use('/api/josselin-plan', josselinPlanRoutes);


// 404 Handler for Debugging
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
});

// Start Server
sequelize.sync({ alter: true }).then(() => {
    console.log('Database synced');
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to sync database:', err);
});
