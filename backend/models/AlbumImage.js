import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AlbumImage = sequelize.define('AlbumImage', {
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
    public_id: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

export default AlbumImage;
