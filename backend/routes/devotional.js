import express from 'express';
import { DevotionalEntry } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Get all entries
router.get('/', async (req, res) => {
    try {
        const entries = await DevotionalEntry.findAll({
            where: { user_id: req.user.id }
        });

        const safeEntries = entries.map(e => ({
            id: e.id,
            text: e.content,
            citation: e.bible_verse,
            date: e.date
        }));

        res.json({ entries: safeEntries });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload JSON endpoint
router.post('/upload', async (req, res) => {
    try {
        let entries = req.body.entries;
        // Accept direct array or wrapped in object
        if (!entries && Array.isArray(req.body)) {
            entries = req.body;
        }

        if (!Array.isArray(entries)) {
            return res.status(400).json({ error: 'Invalid format. Expected array or { entries: [] }' });
        }

        const newEntries = entries.map(e => ({
            user_id: req.user.id,
            content: e.text || e.content,
            bible_verse: e.citation || e.bible_verse,
            date: e.date ? new Date(e.date) : new Date() // Use provided date or now
        }));

        await DevotionalEntry.bulkCreate(newEntries);
        res.json({ success: true, count: newEntries.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new entry
router.post('/', async (req, res) => {
    try {
        const { text, citation, date } = req.body;
        const newEntry = await DevotionalEntry.create({
            user_id: req.user.id,
            content: text,
            bible_verse: citation,
            date: date || new Date()
        });
        res.status(201).json(newEntry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete entry
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await DevotionalEntry.destroy({
            where: { id, user_id: req.user.id }
        });
        if (deleted) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Entry not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
