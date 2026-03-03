import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MotivationalQuote = sequelize.define('MotivationalQuote', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    author: {
        type: DataTypes.STRING,
        defaultValue: ''
    }
});

export default MotivationalQuote;
