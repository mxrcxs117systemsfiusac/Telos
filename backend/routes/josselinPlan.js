import express from 'express';
import { JosselinPlan, sequelize } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const plans = await JosselinPlan.findAll({ where: { user_id: req.user.id } });

        const sectionsMap = {};

        plans.forEach(g => {
            const sectionTitle = g.category || 'General';
            if (!sectionsMap[sectionTitle]) {
                sectionsMap[sectionTitle] = {
                    id: Date.now() + Math.random(),
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
        if (sections.length === 0) {
            sections.push({ id: 1, title: 'Mi Progreso con Ella 💖', items: [] });
        }

        res.json({ sections });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { sections } = req.body;
        if (!sections || !Array.isArray(sections)) {
            await t.rollback();
            return res.status(400).json({ error: 'Invalid format. Expected { sections: [] }' });
        }

        await JosselinPlan.destroy({ where: { user_id: req.user.id }, transaction: t });

        const newPlans = [];

        for (const section of sections) {
            for (const item of section.items) {
                newPlans.push({
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

        if (newPlans.length > 0) {
            await JosselinPlan.bulkCreate(newPlans, { transaction: t });
        }

        await t.commit();
        res.json({ success: true, count: newPlans.length });

    } catch (err) {
        await t.rollback();
        console.error("Error saving josselin plans:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
