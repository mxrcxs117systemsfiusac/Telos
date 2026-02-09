import express from 'express';
import { Goal } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Get all goals
router.get('/', async (req, res) => {
    try {
        const goals = await Goal.findAll({ where: { user_id: req.user.id } });

        // Group by category (Section)
        const sectionsMap = {};

        goals.forEach(g => {
            const sectionTitle = g.category || 'General';
            if (!sectionsMap[sectionTitle]) {
                sectionsMap[sectionTitle] = {
                    id: Date.now() + Math.random(), // Temp ID for frontend
                    title: sectionTitle,
                    items: []
                };
            }

            sectionsMap[sectionTitle].items.push({
                id: g.id,
                text: g.title,
                type: g.start_date ? 'goal' : 'simple',
                completed: g.status === 'completed',
                startDate: g.start_date,
                endDate: g.end_date,
                dailyLogs: g.logs ? JSON.parse(g.logs) : {}
            });
        });

        const sections = Object.values(sectionsMap);
        // If empty, return consistent structure
        if (sections.length === 0) {
            sections.push({ id: 1, title: 'General', items: [] });
        }

        res.json({ sections });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save all goals (Full Sync)
router.post('/', async (req, res) => {
    try {
        const { sections } = req.body;
        if (!sections || !Array.isArray(sections)) {
            return res.status(400).json({ error: 'Invalid format. Expected { sections: [] }' });
        }

        // 1. Delete all existing goals for this user (to handle deletions/moves)
        // In a production app, we might want to be smarter (update existing), but for this scale, flush & rewrite is fine and safer for consistency.
        await Goal.destroy({ where: { user_id: req.user.id } });

        // 2. Prepare new items
        const newGoals = [];

        for (const section of sections) {
            for (const item of section.items) {
                newGoals.push({
                    user_id: req.user.id,
                    title: item.text,
                    description: '',
                    category: section.title,
                    startDate: item.startDate || null,
                    endDate: item.endDate || null,
                    status: item.completed ? 'completed' : 'active',
                    logs: item.dailyLogs || {}
                });
            }
        }

        // 3. Bulk Create
        if (newGoals.length > 0) {
            await Goal.bulkCreate(newGoals);
        }

        res.json({ success: true, count: newGoals.length });
    } catch (err) {
        console.error("Error saving goals:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
