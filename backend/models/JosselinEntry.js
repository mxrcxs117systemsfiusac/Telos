import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const JosselinEntry = sequelize.define('JosselinEntry', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING, // 'progreso', 'le_gusta', 'no_le_gusta', 'quiere', 'info'
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

export default JosselinEntry;
