import sequelize from '../config/database.js';
import User from './User.js';
import FinanceItem from './Finance.js';
import ScheduleEvent from './Schedule.js';
import Task from './Task.js';
import DevotionalEntry from './Devotional.js';
import Resource from './Resource.js';
import Concept from './Concept.js';
import Goal from './Goal.js';

// Define Associations
const models = {
    User,
    FinanceItem,
    ScheduleEvent,
    Task,
    DevotionalEntry,
    Resource,
    Concept,
    Goal
};

// User Associations
User.hasMany(FinanceItem, { foreignKey: 'user_id' });
FinanceItem.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(ScheduleEvent, { foreignKey: 'user_id' });
ScheduleEvent.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Task, { foreignKey: 'user_id' });
Task.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(DevotionalEntry, { foreignKey: 'user_id' });
DevotionalEntry.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Resource, { foreignKey: 'user_id' });
Resource.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Concept, { foreignKey: 'user_id' });
Concept.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Goal, { foreignKey: 'user_id' });
Goal.belongsTo(User, { foreignKey: 'user_id' });

export { sequelize, User, FinanceItem, ScheduleEvent, Task, DevotionalEntry, Resource, Concept, Goal };
export default models;
