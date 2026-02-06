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
        // Transform to match legacy format if needed, or update frontend
        // Legacy: { entries: [ { text, citation } ] }
        // We can return list directly or wrap it?
        // Let's check frontend expectation. But for now, let's return the list.
        // Wait, legacy handler returned the whole JSON object: { entries: [...] }
        // So we should probably return { entries: [...] } to avoid breaking frontend

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

export default router;
