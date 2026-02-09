import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Goal = sequelize.define('Goal', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    startDate: {
        type: DataTypes.DATEONLY
    },
    endDate: {
        type: DataTypes.DATEONLY
    },
    status: {
        type: DataTypes.ENUM('not_progressed', 'progressed', 'completed'),
        defaultValue: 'not_progressed'
    },
    logs: {
        type: DataTypes.JSON // Stores daily logs: { "YYYY-MM-DD": { completed, learned, notes, status } }
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: 'General'
    }
});

export default Goal;
