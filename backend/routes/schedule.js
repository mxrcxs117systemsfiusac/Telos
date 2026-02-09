import express from 'express';
import { ScheduleEvent } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all events
router.get('/', authenticateToken, async (req, res) => {
    try {
        const events = await ScheduleEvent.findAll({ where: { user_id: req.user.id } });
        // Map native DB fields to Frontend expected fields
        const safeEvents = events.map(e => ({
            id: e.id,
            title: e.title,
            day: e.day,
            start: e.start_time, // Standardize to 'start' for UI
            end: e.end_time,     // Standardize to 'end' for UI
            description: e.description,
            color: e.color,
            category: e.category
        }));
        res.json({ events: safeEvents });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Event
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, day, start, end, description, color } = req.body;
        // Logic to construct 'start' and 'end' Date objects if your DB uses DATETIME, 
        // OR keep them as strings if your DB model uses strings (or if you store generic weekly schedule)
        // The Model I created (Schedule.js) uses DATE type for start/end.
        // BUT the frontend uses "Day" + "Time" (Weekly schedule).
        // This is a mismatch. 
        // A "Weekly Schedule" usually doesn't have specific dates. 
        // If the app is a "Class Schedule" (Weekly), I should store `dayOfWeek` and `time`.
        // Let's check the JSON data structure.

        // My Model: start: DATE, end: DATE.
        // Frontend: day: string ('Monday'), start: string ('10:00').

        // I should probably UPDATE the Model to match the "Weekly Schedule" nature if that's what it is.
        // OR I store it as a generic date in 1970?
        // Better: Change model to `dayOfWeek`, `startTime`, `endTime`.

        // For now, I will save them as strings or handle it.
        // Let's assume I update the model or reuse fields. 
        // If I use Sequelize DATE, I must provide a date.

        // I will use `startTime` and `endTime` as TIME or STRING in SQLite?
        // SQLite doesn't have Time type. STRING is fine.

        // I will modify the model in the same step if possible or via separate call.
        // Let's assume I will fix the model.

        const newEvent = await ScheduleEvent.create({
            user_id: req.user.id,
            title,
            day,
            start_time: start,
            end_time: end,
            description,
            color
        });
        res.json(newEvent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Event
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { title, day, start, end, description, color } = req.body;
        const [updated] = await ScheduleEvent.update({
            title, day, start_time: start, end_time: end, description, color
        }, { where: { id: req.params.id, user_id: req.user.id } });

        if (updated) res.json({ success: true });
        else res.status(404).json({ error: "Not found" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Event
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await ScheduleEvent.destroy({ where: { id: req.params.id, user_id: req.user.id } });
        if (result) res.json({ success: true });
        else res.status(404).json({ error: 'Not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
