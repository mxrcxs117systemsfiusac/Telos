import express from 'express';
import { Task, Resource, Concept } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const PDF_DIR = path.join(DATA_DIR, 'pdfs');

const router = express.Router();

// GET All
router.get('/', authenticateToken, async (req, res) => {
    try {
        const tasks = await Task.findAll({ where: { user_id: req.user.id } });
        const concepts = await Concept.findAll({ where: { user_id: req.user.id } });
        const resources = await Resource.findAll({ where: { user_id: req.user.id, type: 'pdf' } });

        // Map resources to pdfs format expected by frontend if needed or just return list
        // Frontend expects { tasks, concepts, pdfs }
        res.json({
            tasks,
            concepts,
            pdfs: resources,
            // Categories default or from DB if we had a Category model. For now defaults.
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
            description: description || '' // Save description
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

router.post('/upload-pdf', authenticateToken, async (req, res) => {
    try {
        const { name, data } = req.body; // Base64
        if (!name || !data) return res.status(400).json({ error: 'Missing data' });

        // Save File
        const base64Data = data.split(';base64,').pop();
        if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

        // Ensure unique filename to prevent overwrite by other users?
        // For simplicity, prefix with timestamp or userid
        const safeName = `${Date.now()}_${name}`;
        fs.writeFileSync(path.join(PDF_DIR, safeName), base64Data, { encoding: 'base64' });

        // Create Record
        const newResource = await Resource.create({
            user_id: req.user.id,
            name: name, // Original name
            url: `/pdfs/${safeName}`,
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

export default router;
