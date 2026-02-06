import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Concept = sequelize.define('Concept', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    term: {
        type: DataTypes.STRING,
        allowNull: false
    },
    definition: {
        type: DataTypes.TEXT,
        allowNull: false
    }
});

export default Concept;
