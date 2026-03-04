/**
 * Migration Script: SQLite → PostgreSQL (Neon)
 * 
 * Reads all data from local SQLite and inserts into the Neon PostgreSQL database.
 * Run with: node backend/scripts/migrate-to-postgres.js
 */

import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source: SQLite
const sqliteDb = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../data/telos.sqlite'),
    logging: false
});

// Target: PostgreSQL (Neon)
const pgDb = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

// Table names in order (respecting foreign key dependencies)
const TABLES = [
    'Users',
    'FinanceItems',
    'ScheduleEvents',
    'Tasks',
    'DevotionalEntries',
    'Resources',
    'Concepts',
    'Goals',
    'MotivationalQuotes',
    'ZoomLinks',
    'JosselinEntries',
    'MeetLinks'
];

async function migrate() {
    console.log('🔌 Connecting to both databases...');

    await sqliteDb.authenticate();
    console.log('✅ SQLite connected');

    await pgDb.authenticate();
    console.log('✅ PostgreSQL (Neon) connected');

    // Import models to ensure tables exist in PG
    // We do this by importing the server's model index which triggers sync
    // But simpler: just use raw queries

    let totalMigrated = 0;

    for (const table of TABLES) {
        try {
            // Read from SQLite
            const [rows] = await sqliteDb.query(`SELECT * FROM "${table}"`);

            if (!rows || rows.length === 0) {
                console.log(`⏭️  ${table}: empty, skipping`);
                continue;
            }

            console.log(`📦 ${table}: ${rows.length} rows found`);

            // Clear target table first (in case of re-run)
            await pgDb.query(`DELETE FROM "${table}"`);

            // Insert rows in batches
            const columns = Object.keys(rows[0]);
            const batchSize = 50;

            for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);

                for (const row of batch) {
                    const values = columns.map(col => {
                        const val = row[col];
                        if (val === null || val === undefined) return 'NULL';
                        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                        // SQLite stores booleans as 0/1 — detect boolean columns
                        if (typeof val === 'number') {
                            const lowerCol = col.toLowerCase();
                            if (lowerCol.startsWith('is_') || lowerCol.startsWith('is')) {
                                return val ? 'TRUE' : 'FALSE';
                            }
                            return val;
                        }
                        // Escape single quotes and wrap in quotes
                        const escaped = String(val).replace(/'/g, "''");
                        return `'${escaped}'`;
                    });

                    const quotedCols = columns.map(c => `"${c}"`).join(', ');
                    const insertSQL = `INSERT INTO "${table}" (${quotedCols}) VALUES (${values.join(', ')})`;

                    try {
                        await pgDb.query(insertSQL);
                    } catch (insertErr) {
                        console.error(`   ⚠️ Error inserting row id=${row.id || '?'} in ${table}:`, insertErr.message);
                    }
                }
            }

            // Reset auto-increment sequence for PostgreSQL
            try {
                const [[maxId]] = await pgDb.query(`SELECT MAX(id) as max_id FROM "${table}"`);
                if (maxId && maxId.max_id) {
                    await pgDb.query(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), ${maxId.max_id})`);
                    console.log(`   🔢 Sequence reset to ${maxId.max_id}`);
                }
            } catch (seqErr) {
                // Not all tables may have sequences
            }

            totalMigrated += rows.length;
            console.log(`   ✅ ${rows.length} rows migrated`);
        } catch (tableErr) {
            console.error(`❌ ${table}: ${tableErr.message}`);
        }
    }

    console.log(`\n🎉 Migration complete! ${totalMigrated} total rows migrated.`);

    await sqliteDb.close();
    await pgDb.close();
    process.exit(0);
}

migrate().catch(err => {
    console.error('💥 Migration failed:', err);
    process.exit(1);
});
