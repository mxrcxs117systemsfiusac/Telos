import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FinanceItem = sequelize.define('FinanceItem', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('income', 'expense', 'saving', 'payment', 'planned_income', 'planned_expense', 'savings_meta', 'savings_image_url'),
        allowNull: false
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING
    },
    is_recurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_paid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

export default FinanceItem;
