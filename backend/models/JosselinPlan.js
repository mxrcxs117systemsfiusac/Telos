import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const JosselinPlan = sequelize.define('JosselinPlan', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'not_progressed'
    },
    logs: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    }
});

export default JosselinPlan;
