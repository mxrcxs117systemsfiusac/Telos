import express from 'express';
import { MotivationalQuote } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Get all quotes
router.get('/', async (req, res) => {
    try {
        const quotes = await MotivationalQuote.findAll({
            where: { user_id: req.user.id }
        });
        res.json({ entries: quotes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new quote
router.post('/', async (req, res) => {
    try {
        const { text, author } = req.body;
        const newQuote = await MotivationalQuote.create({
            user_id: req.user.id,
            text,
            author: author || ''
        });
        res.status(201).json(newQuote);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete quote
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await MotivationalQuote.destroy({
            where: { id, user_id: req.user.id }
        });
        if (deleted) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Quote not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete all quotes
router.delete('/', async (req, res) => {
    try {
        await MotivationalQuote.destroy({
            where: { user_id: req.user.id }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
