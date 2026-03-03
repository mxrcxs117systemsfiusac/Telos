import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MeetLink = sequelize.define('MeetLink', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    course_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

export default MeetLink;
