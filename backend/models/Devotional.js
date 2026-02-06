import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DevotionalEntry = sequelize.define('DevotionalEntry', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    bible_verse: {
        type: DataTypes.STRING
    },
    content: {
        type: DataTypes.TEXT
    }
});

export default DevotionalEntry;
