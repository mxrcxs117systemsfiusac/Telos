import express from 'express';
import { FinanceItem } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all finance data (formatted for frontend compatibility)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const items = await FinanceItem.findAll({ where: { user_id: req.user.id } });

        // Transform to legacy format
        const data = {
            ingresos: items.filter(i => i.type === 'income').map(i => i.toJSON()),
            egresos: items.filter(i => i.type === 'expense').map(i => i.toJSON()),
            pagos: [], // Recurring payments logic to be added
            metaAhorro: 0, // Need a Settings table for this or generic key-value
            ahorroActual: items.filter(i => i.type === 'saving').reduce((acc, curr) => acc + curr.amount, 0),
            plannedIncomes: []
        };
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generic Add Item
router.post('/add', authenticateToken, async (req, res) => {
    try {
        const { type, amount, category, date, description } = req.body;
        const newItem = await FinanceItem.create({
            user_id: req.user.id,
            type,
            amount,
            category,
            date,
            description
        });
        res.json(newItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Item
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await FinanceItem.destroy({ where: { id: req.params.id, user_id: req.user.id } });
        if (result) res.json({ success: true });
        else res.status(404).json({ error: 'Item not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Item
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { type, amount, category, date, description, is_recurring } = req.body;
        const [updated] = await FinanceItem.update({
            type, amount, category, date, description, is_recurring
        }, { where: { id: req.params.id, user_id: req.user.id } });

        if (updated) res.json({ success: true });
        else res.status(404).json({ error: 'Item not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
