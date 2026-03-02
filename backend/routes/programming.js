import express from 'express';
import { Goal, sequelize } from '../models/index.js';
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
                type: g.startDate ? 'goal' : 'simple',
                completed: g.status === 'completed',
                startDate: g.startDate,
                endDate: g.endDate,
                dailyLogs: g.logs ? (typeof g.logs === 'string' ? JSON.parse(g.logs) : g.logs) : {}
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
    // Start Transaction
    const t = await sequelize.transaction();

    try {
        const { sections } = req.body;
        if (!sections || !Array.isArray(sections)) {
            await t.rollback();
            return res.status(400).json({ error: 'Invalid format. Expected { sections: [] }' });
        }

        // 1. Delete all existing goals for this user
        await Goal.destroy({ where: { user_id: req.user.id }, transaction: t });

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
                    status: item.completed ? 'completed' : 'not_progressed',
                    logs: item.dailyLogs || {}
                });
            }
        }

        // 3. Bulk Create
        if (newGoals.length > 0) {
            await Goal.bulkCreate(newGoals, { transaction: t });
        }

        // Commit
        await t.commit();
        res.json({ success: true, count: newGoals.length });

    } catch (err) {
        // Rollback
        await t.rollback();
        console.error("Error saving goals:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
