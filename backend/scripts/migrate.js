import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize, User, FinanceItem, ScheduleEvent, Task, Concept, Resource, DevotionalEntry } from '../models/index.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

async function migrate() {
    try {
        await sequelize.sync({ force: true });
        console.log('Database synced (force reset).');

        // 1. Create Default User
        let user = await User.create({ username: 'admin', password_hash: await bcrypt.hash('admin123', 10) });
        console.log('Created default user: admin / admin123');
        const userId = user.id;

        // 2. Migrate Finance
        const financePath = path.join(DATA_DIR, 'finance-data.json');
        if (fs.existsSync(financePath)) {
            const data = JSON.parse(fs.readFileSync(financePath, 'utf8'));
            const { ingresos, egresos, pagos, ahorroActual } = data;

            // Ingresos
            if (ingresos) {
                for (const item of ingresos) {
                    await FinanceItem.create({
                        user_id: userId,
                        type: 'income',
                        amount: item.monto,
                        category: item.categoria,
                        date: item.fecha,
                        description: item.descripcion
                    });
                }
            }
            // ...

            // Egresos
            if (egresos) {
                for (const item of egresos) {
                    await FinanceItem.create({
                        user_id: userId,
                        type: 'expense',
                        amount: item.monto,
                        category: item.categoria,
                        date: item.fecha,
                        description: item.descripcion
                    });
                }
            }
            // Pagos (Fixed)
            if (pagos) {
                for (const item of pagos) {
                    await FinanceItem.create({
                        user_id: userId,
                        type: 'payment',
                        amount: item.monto,
                        category: item.categoria,
                        date: item.fecha,
                        description: item.descripcion,
                        is_recurring: true
                    });
                }
            }
            // Savings (as a record?)
            // We just store current savings? Or log it?
            if (ahorroActual) {
                await FinanceItem.create({
                    user_id: userId,
                    type: 'saving',
                    amount: ahorroActual,
                    category: 'Inicial',
                    date: new Date().toISOString().split('T')[0],
                    description: 'Migrated Savings'
                });
            }
            console.log('Finance migrated.');
        }

        // 3. Migrate Schedule
        const schedulePath = path.join(DATA_DIR, 'schedule.json');
        if (fs.existsSync(schedulePath)) {
            const data = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
            if (data.events) {
                for (const event of data.events) {
                    await ScheduleEvent.create({
                        user_id: userId,
                        title: event.title,
                        day: event.day,
                        start: event.start, // Assuming string format matches
                        end: event.end,
                        description: event.description,
                        color: event.color
                    });
                }
            }
            console.log('Schedule migrated.');
        }

        // 4. Migrate Study
        const studyPath = path.join(DATA_DIR, 'study.json');
        if (fs.existsSync(studyPath)) {
            const data = JSON.parse(fs.readFileSync(studyPath, 'utf8'));
            if (data.tasks) {
                for (const task of data.tasks) {
                    await Task.create({
                        user_id: userId,
                        title: task.text,
                        subject: task.category,
                        deadline: task.date,
                        status: task.completed ? 'completed' : 'pending'
                    });
                }
            }
            if (data.concepts) {
                for (const c of data.concepts) {
                    await Concept.create({
                        user_id: userId,
                        term: c.term,
                        definition: c.definition
                    });
                }
            }
            if (data.pdfProgress) {
                // If we knew filenames, we could map them. 
                // But we need to scan 'pdfs/' dir to create Resources first.
            }
            console.log('Study migrated.');
        }

        // 5. Migrate Devotional
        const devotionalPath = path.join(DATA_DIR, 'devotional.json');
        if (fs.existsSync(devotionalPath)) {
            const data = JSON.parse(fs.readFileSync(devotionalPath, 'utf8'));
            if (data.entries) {
                const today = new Date().toISOString().split('T')[0];
                for (const entry of data.entries) {
                    await DevotionalEntry.create({
                        user_id: userId,
                        date: today,
                        bible_verse: entry.citation,
                        content: entry.text
                    });
                }
            }
            console.log('Devotional migrated.');
        }

        // Resources (Scan PDF Dir)
        const pdfDir = path.join(DATA_DIR, 'pdfs');
        if (fs.existsSync(pdfDir)) {
            const files = fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf'));
            const studyData = fs.existsSync(studyPath) ? JSON.parse(fs.readFileSync(studyPath, 'utf8')) : {};
            const progressMap = studyData.pdfProgress || {};

            for (const file of files) {
                const safeUrl = `/pdfs/${file}`;
                // Check if exists
                const existing = await Resource.findOne({ where: { user_id: userId, url: safeUrl } });
                if (!existing) {
                    await Resource.create({
                        user_id: userId,
                        name: file,
                        url: safeUrl,
                        type: 'pdf',
                        progress: progressMap[file] || 1
                    });
                }
            }
            console.log('PDF resources migrated.');
        }

        console.log('Migration Complete.');
        process.exit(0);

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
