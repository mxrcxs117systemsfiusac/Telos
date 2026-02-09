import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ScheduleEvent = sequelize.define('ScheduleEvent', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    day: {
        type: DataTypes.STRING, // e.g., 'Lunes', 'Monday'
        allowNull: false
    },
    start_time: {
        type: DataTypes.STRING, // '08:00'
        allowNull: false
    },
    end_time: {
        type: DataTypes.STRING, // '09:00'
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    color: {
        type: DataTypes.STRING,
        defaultValue: '#4f46e5'
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: 'general'
    }
});

export default ScheduleEvent;
