import express from 'express';
import { FinanceItem } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all finance data (formatted for frontend compatibility)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const items = await FinanceItem.findAll({ where: { user_id: req.user.id } });

        // Read persisted savings metadata
        const metaItem = items.find(i => i.type === 'savings_meta' && i.category === 'meta_ahorro');
        const ahorroItem = items.find(i => i.type === 'savings_meta' && i.category === 'ahorro_actual');

        const data = {
            ingresos: items.filter(i => i.type === 'income').map(i => ({ ...i.toJSON(), monto: i.amount, fecha: i.date, descripcion: i.description })),
            egresos: items.filter(i => i.type === 'expense').map(i => ({ ...i.toJSON(), monto: i.amount, fecha: i.date, descripcion: i.description })),
            pagos: items.filter(i => i.type === 'payment').map(i => ({ ...i.toJSON(), monto: i.amount, fecha: i.date, descripcion: i.description, isPaid: i.is_paid })),
            metaAhorro: metaItem ? metaItem.amount : 0,
            ahorroActual: ahorroItem ? ahorroItem.amount : 0,
            plannedIncomes: items.filter(i => i.type === 'planned_income').map(i => ({ ...i.toJSON(), monto: i.amount, fecha: i.date, descripcion: i.description, isReceived: i.is_paid })),
            savingsImage: items.find(i => i.type === 'savings_image_url')?.description || null
        };

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper to upsert a savings_meta item
async function upsertSavingsMeta(userId, category, amount) {
    let item = await FinanceItem.findOne({ where: { user_id: userId, type: 'savings_meta', category } });
    if (item) {
        item.amount = amount;
        await item.save();
    } else {
        await FinanceItem.create({
            user_id: userId,
            type: 'savings_meta',
            amount,
            category,
            description: category,
            date: new Date()
        });
    }
}

// Update generic finance data (savings image, meta, ahorro)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { savingsImage, metaAhorro, ahorroActual } = req.body;

        if (savingsImage !== undefined) {
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

        if (metaAhorro !== undefined) {
            await upsertSavingsMeta(req.user.id, 'meta_ahorro', Number(metaAhorro));
        }

        if (ahorroActual !== undefined) {
            await upsertSavingsMeta(req.user.id, 'ahorro_actual', Number(ahorroActual));
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
