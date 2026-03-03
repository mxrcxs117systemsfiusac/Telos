import express from 'express';
import { MeetLink } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// GET all meet links
router.get('/meet-links', async (req, res) => {
    try {
        const links = await MeetLink.findAll({ where: { user_id: req.user.id } });
        res.json(links);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST new meet link
router.post('/meet-links', async (req, res) => {
    try {
        const { course_name, url } = req.body;
        const link = await MeetLink.create({
            user_id: req.user.id,
            course_name, url
        });
        res.status(201).json(link);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE meet link
router.delete('/meet-links/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await MeetLink.destroy({ where: { id, user_id: req.user.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
