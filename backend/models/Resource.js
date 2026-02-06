import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Resource = sequelize.define('Resource', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING, // 'pdf', 'link', etc.
        defaultValue: 'pdf'
    },
    progress: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
});

export default Resource;
