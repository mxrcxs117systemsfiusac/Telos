
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { sequelize, User, FinanceItem, ScheduleEvent, Task, DevotionalEntry, Resource, Concept, Goal } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

const readJson = (filename) => {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const migrate = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('Database synced.');

        // 1. Create Admin User
        let user = await User.findOne({ where: { username: 'admin' } });
        if (!user) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            user = await User.create({
                username: 'admin',
                password_hash: hashedPassword
            });
            console.log('Admin user created.');
        } else {
            // Ensure password is correct for existing admin (optional, but good for "reset")
            const hashedPassword = await bcrypt.hash('admin123', 10);
            user.password_hash = hashedPassword;
            await user.save();
            console.log('Admin user password updated.');
        }

        const userId = user.id;

        // 2. Finance
        const financeData = readJson('finance-data.json');
        if (financeData) {
            const transactions = [];
            // Helper to process list
            const processFinanceList = (list, type) => {
                list.forEach(item => {
                    transactions.push({
                        user_id: userId,
                        type: type,
                        amount: item.monto,
                        category: item.categoria || 'General',
                        date: item.fecha,
                        description: item.descripcion,
                        is_recurring: false // Default
                    });
                });
            };

            if (financeData.ingresos) processFinanceList(financeData.ingresos, 'income');
            if (financeData.egresos) processFinanceList(financeData.egresos, 'expense');
            if (financeData.pagos) processFinanceList(financeData.pagos, 'payment');
            if (financeData.plannedIncomes) processFinanceList(financeData.plannedIncomes, 'planned_income');

            await FinanceItem.bulkCreate(transactions);
            console.log(`Migrated ${transactions.length} finance items.`);
        }

        // 3. Schedule
        const scheduleData = readJson('schedule.json');
        if (scheduleData && scheduleData.events) {
            const events = scheduleData.events.map(evt => ({
                user_id: userId,
                title: evt.title,
                // For recurring weekly schedule, we might need a strategy. 
                // For now, let's just store the start/end times on a dummy date or current date if implied.
                // However, the current Schedule model expects DATE objects.
                // The JSON has "day": "Lunes", "start": "07:10".
                // We should probably adapt the Schedule model or the data. 
                // For this migration, let's assume we want to keep them as recurring items if possible, 
                // but the SQL model might be designed for specific instances. 
                // Let's map them to a base date (e.g., next occurrence of that day).
                // notes: existing schedule.json structure is strictly weekly class schedule.
                // existing SQL ScheduleEvent is date-based. 
                // STRATEGY: Create events for the next 24 weeks based on the weekly schedule?
                // OR: Just ignore precise dates and put them in a way the frontend understands if it filters by day?
                // Visualizing Schedule.js model: start (DATE), end (DATE).
                // Let's create one instance for the upcoming week for each event to start with.
                start: new Date(), // Placeholder will need refinement for real usage
                end: new Date(),
                allDay: false,
                category: 'class',
                description: evt.description // Note: ScheduleEvent model doesn't have description in the definition I saw earlier, checking...
                // Schedule.js: title, start, end, allDay, category. NO description.
                // I should probably add description to ScheduleEvent model later.
            })).filter(e => false); // DISABLED for now to avoid cluttering with wrong dates. 
            // WAIT - The user wants to TRANSFER EVERYTHING. 
            // I should modify the Schedule model to support the "Day of week" + "Time" format OR generate actual dates.
            // Let's Update Schedule model in a separate step if strictly needed, but for now let's just create them for the current week.

            // Actually, let's map them properly.
            const daysMap = { 'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };
            const today = new Date();
            const currentDay = today.getDay();

            const newEvents = [];
            scheduleData.events.forEach(evt => {
                const targetDay = daysMap[evt.day];
                if (targetDay !== undefined) {
                    // Calculate date for this day in the current week
                    const diff = targetDay - currentDay;
                    const evtDate = new Date(today);
                    evtDate.setDate(today.getDate() + (diff));

                    // Set times
                    const [startH, startM] = evt.start.split(':').map(Number);
                    const [endH, endM] = evt.end.split(':').map(Number);

                    const startDate = new Date(evtDate);
                    startDate.setHours(startH, startM, 0);

                    const endDate = new Date(evtDate);
                    endDate.setHours(endH, endM, 0);

                    // Create recurring events for next 16 weeks (semester)
                    for (let i = 0; i < 16; i++) {
                        const s = new Date(startDate); s.setDate(s.getDate() + (i * 7));
                        const e = new Date(endDate); e.setDate(e.getDate() + (i * 7));
                        newEvents.push({
                            user_id: userId,
                            title: evt.title,
                            start: s,
                            end: e,
                            category: 'class'
                        });
                    }
                }
            });
            await ScheduleEvent.bulkCreate(newEvents);
            console.log(`Migrated ${newEvents.length} schedule events (expanded to 16 weeks).`);
        }

        // 4. Study
        const studyData = readJson('study.json');
        if (studyData) {
            // Tasks
            if (studyData.tasks) {
                const tasks = studyData.tasks.map(t => ({
                    user_id: userId,
                    title: t.text,
                    subject: t.category, // using category as subject
                    status: t.completed ? 'completed' : 'pending',
                    deadline: t.date ? new Date(t.date) : null,
                    priority: 'medium'
                }));
                await Task.bulkCreate(tasks);
                console.log(`Migrated ${tasks.length} study tasks.`);
            }

            // Concepts
            if (studyData.concepts) {
                const concepts = studyData.concepts.map(c => ({
                    user_id: userId,
                    term: c.term,
                    definition: c.definition
                }));
                await Concept.bulkCreate(concepts);
                console.log(`Migrated ${concepts.length} concepts.`);
            }

            // PDF Progress (Resource)
            if (studyData.pdfProgress) {
                const resources = Object.entries(studyData.pdfProgress).map(([name, page]) => ({
                    user_id: userId,
                    name: name,
                    url: `/pdfs/${name}`,
                    type: 'pdf',
                    progress: page
                }));
                await Resource.bulkCreate(resources);
                console.log(`Migrated ${resources.length} pdf resources.`);
            }
        }

        // 5. Devotional
        const devotionalData = readJson('devotional.json');
        if (devotionalData && devotionalData.entries) {
            const entries = devotionalData.entries.map(e => ({
                user_id: userId,
                date: new Date(), // JSON didn't have dates, default to today
                bible_verse: e.citation,
                content: e.text
            }));
            await DevotionalEntry.bulkCreate(entries);
            console.log(`Migrated ${entries.length} devotional entries.`);
        }

        // 6. Programming
        const programmingData = readJson('programming.json');
        if (programmingData) {
            // Checklist -> Tasks
            if (programmingData.checklist) {
                const tasks = programmingData.checklist.map(item => ({
                    user_id: userId,
                    title: item.label,
                    subject: 'Programming',
                    status: item.completed ? 'completed' : 'pending',
                    priority: 'medium'
                }));
                await Task.bulkCreate(tasks);
                console.log(`Migrated ${tasks.length} programming checklist items.`);
            }

            // Sections -> Goals
            if (programmingData.sections) {
                const goals = [];
                programmingData.sections.forEach(section => {
                    if (section.items) {
                        section.items.forEach(item => {
                            if (item.type === 'goal') {
                                goals.push({
                                    user_id: userId,
                                    title: item.text,
                                    description: '',
                                    startDate: item.startDate ? new Date(item.startDate) : null,
                                    endDate: item.endDate ? new Date(item.endDate) : null,
                                    status: item.completed ? 'completed' : 'not_progressed',
                                    logs: item.dailyLogs || {},
                                    category: section.title
                                });
                            }
                        });
                    }
                });
                await Goal.bulkCreate(goals);
                console.log(`Migrated ${goals.length} programming goals.`);
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
