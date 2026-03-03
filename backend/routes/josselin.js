import express from 'express';
import { JosselinEntry } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// GET all entries (optionally filter by category)
router.get('/', async (req, res) => {
    try {
        const where = { user_id: req.user.id };
        if (req.query.category) where.category = req.query.category;
        const entries = await JosselinEntry.findAll({ where, order: [['createdAt', 'DESC']] });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST new entry
router.post('/', async (req, res) => {
    try {
        const { category, title, content } = req.body;
        const entry = await JosselinEntry.create({
            user_id: req.user.id,
            category, title, content
        });
        res.status(201).json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update entry
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { category, title, content } = req.body;
        await JosselinEntry.update({ category, title, content }, { where: { id, user_id: req.user.id } });
        const updated = await JosselinEntry.findByPk(id);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE entry
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await JosselinEntry.destroy({ where: { id, user_id: req.user.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
