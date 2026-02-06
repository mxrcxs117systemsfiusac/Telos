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
    start: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end: {
        type: DataTypes.DATE,
        allowNull: true
    },
    allDay: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    category: { // e.g. 'class', 'exam', 'personal'
        type: DataTypes.STRING,
        defaultValue: 'general'
    }
});

export default ScheduleEvent;
