import express from 'express';
import { Task, Resource, Concept } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadFile } from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// GET All
router.get('/', authenticateToken, async (req, res) => {
    try {
        const tasks = await Task.findAll({ where: { user_id: req.user.id } });
        const concepts = await Concept.findAll({ where: { user_id: req.user.id } });
        const resources = await Resource.findAll({ where: { user_id: req.user.id, type: 'pdf' } });

        res.json({
            tasks,
            concepts,
            pdfs: resources,
            categories: ['Universidad', 'Iglesia', 'Personal', 'Otro']
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TASKS ---
router.post('/tasks', authenticateToken, async (req, res) => {
    try {
        const { text, description, date, startTime, endTime, category } = req.body;
        const newItem = await Task.create({
            user_id: req.user.id,
            title: text,
            subject: category,
            deadline: date,
            status: 'pending',
            description: description || ''
        });
        res.json(newItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { text, description, date, completed } = req.body;
        await Task.update({
            title: text,
            deadline: date,
            status: completed ? 'completed' : 'pending'
        }, { where: { id: req.params.id, user_id: req.user.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/tasks/:id', authenticateToken, async (req, res) => {
    try {
        await Task.destroy({ where: { id: req.params.id, user_id: req.user.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CONCEPTS ---
router.post('/concepts', authenticateToken, async (req, res) => {
    try {
        const { term, definition } = req.body;
        const newConcept = await Concept.create({
            user_id: req.user.id,
            term,
            definition
        });
        res.json(newConcept);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/concepts/:id', authenticateToken, async (req, res) => {
    try {
        await Concept.destroy({ where: { id: req.params.id, user_id: req.user.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PDFS ---
router.get('/pdfs', authenticateToken, async (req, res) => {
    try {
        const resources = await Resource.findAll({ where: { user_id: req.user.id, type: 'pdf' } });
        res.json(resources);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/upload-pdf', authenticateToken, uploadFile.single('pdf'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const newResource = await Resource.create({
            user_id: req.user.id,
            name: req.file.originalname || 'document.pdf',
            url: req.file.path,       // Cloudinary URL
            type: 'pdf'
        });

        res.json(newResource);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/pdfs/:id', authenticateToken, async (req, res) => {
    try {
        const { progress } = req.body;
        await Resource.update({ progress }, { where: { id: req.params.id, user_id: req.user.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/pdfs/:id', authenticateToken, async (req, res) => {
    try {
        const resource = await Resource.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!resource) return res.status(404).json({ error: 'PDF not found' });

        // Try to extract public_id from Cloudinary URL and delete
        try {
            const urlParts = resource.url.split('/');
            const fileWithExt = urlParts.slice(-2).join('/'); // folder/filename
            const publicId = fileWithExt.replace(/\.[^/.]+$/, ''); // remove extension
            await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        } catch (cloudErr) {
            console.error('Cloudinary delete error (non-fatal):', cloudErr.message);
        }

        await resource.destroy();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

