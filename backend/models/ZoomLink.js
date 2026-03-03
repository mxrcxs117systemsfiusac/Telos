import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ZoomLink = sequelize.define('ZoomLink', {
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
    day: {
        type: DataTypes.STRING, // 'Lunes', 'Martes', etc.
        allowNull: true
    },
    time: {
        type: DataTypes.STRING, // '19:00'
        allowNull: true
    }
});

export default ZoomLink;
