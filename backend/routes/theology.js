import express from 'express';
import { ZoomLink } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// GET all zoom links
router.get('/zoom-links', async (req, res) => {
    try {
        const links = await ZoomLink.findAll({ where: { user_id: req.user.id } });
        res.json(links);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST new zoom link
router.post('/zoom-links', async (req, res) => {
    try {
        const { name, url, day, time } = req.body;
        const link = await ZoomLink.create({
            user_id: req.user.id,
            name, url, day, time
        });
        res.status(201).json(link);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update zoom link
router.put('/zoom-links/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, url, day, time } = req.body;
        await ZoomLink.update({ name, url, day, time }, { where: { id, user_id: req.user.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE zoom link
router.delete('/zoom-links/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await ZoomLink.destroy({ where: { id, user_id: req.user.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
