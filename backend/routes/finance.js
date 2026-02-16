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
            ingresos: items.filter(i => i.type === 'income').map(i => ({ ...i.toJSON(), monto: i.amount, fecha: i.date, descripcion: i.description })),
            egresos: items.filter(i => i.type === 'expense').map(i => ({ ...i.toJSON(), monto: i.amount, fecha: i.date, descripcion: i.description })),
            pagos: items.filter(i => i.type === 'payment').map(i => ({ ...i.toJSON(), monto: i.amount, fecha: i.date, descripcion: i.description, isPaid: i.is_paid })),
            metaAhorro: 0, // Placeholder
            ahorroActual: items.filter(i => i.type === 'saving').reduce((acc, curr) => acc + curr.amount, 0),
            plannedIncomes: items.filter(i => i.type === 'planned_income').map(i => ({ ...i.toJSON(), monto: i.amount, fecha: i.date, descripcion: i.description, isReceived: i.is_paid })),
            savingsImage: items.find(i => i.type === 'savings_image_url')?.description || null // Hacky storage for image URL if needed, or better use a settings table. 
            // Better: Just check if we saved it in a separate file or metadata. 
            // For now, let's assume the frontend handles it or we return it if we stored it.
        };

        // If we want to persist savingsImage properly, we might need a separate model or a special item.
        // Let's check if the Settings page upload stored it somewhere. 
        // The Settings page updated "savingsImage" in the finance JSON endpoint.
        // We need to support saving/retrieving that property. 
        // Let's add a "metadata" item or similar.

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update generic finance data (e.g. Savings Image)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { savingsImage } = req.body;

        if (savingsImage !== undefined) {
            // Check if exists
            let item = await FinanceItem.findOne({ where: { user_id: req.user.id, type: 'savings_image_url' } });
            if (item) {
                if (savingsImage === null) {
                    await item.destroy();
                } else {
                    item.description = savingsImage;
                    await item.save();
                }
            } else if (savingsImage) {
                await FinanceItem.create({
                    user_id: req.user.id,
                    type: 'savings_image_url',
                    amount: 0,
                    category: 'System',
                    description: savingsImage,
                    date: new Date()
                });
            }
        }

        res.json({ success: true });
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
        const { type, amount, category, date, description, is_recurring, isPaid, isReceived } = req.body;
        // Map isPaid/isReceived to is_paid
        const finalIsPaid = (isPaid !== undefined) ? isPaid : (isReceived !== undefined ? isReceived : false);

        const [updated] = await FinanceItem.update({
            type, amount, category, date, description, is_recurring, is_paid: finalIsPaid
        }, { where: { id: req.params.id, user_id: req.user.id } });

        if (updated) res.json({ success: true });
        else res.status(404).json({ error: 'Item not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
