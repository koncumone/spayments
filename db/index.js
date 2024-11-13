const   fs              = require('fs'),
        path            = require('path'),
        Sequelize       = require('sequelize');

class Database {
    constructor() {
        if (Database.instance) {
            return Database.instance
        }

        this.sequelize = new Sequelize("s", "kncmn", "", {dialect: "mysql", host: "", logging: false});

        this.authenticate()
        this.models = this.loadModels()
        this.setupAssociations()

        Database.instance = this

    }

    async authenticate() {
        try {
            await this.sequelize.authenticate()
            console.log('Connection has been established successfully.');
        } catch (error) {
            console.error('Unable to connect to the database:', error);
        }
    }

    loadModels() {
        const models = {};
        const modelsPath = path.join(__dirname, 'models');

        fs.readdirSync(modelsPath).filter((file) => {
            return (file.indexOf('.') !== 0) && (file !== 'index.js');
        }).forEach((file) => {
            const model = require(`${modelsPath}/${file.split('.')[0]}`)(this.sequelize, Sequelize);
            models[file.split('.')[0]] = model;
        });

        models.Op = Sequelize.Op;
        this.sequelize.sync({ alter: true });

        return models;
    }

    setupAssociations() {
        const { users, balances, logs, settings, wallets, withdrawals, checks, invoices } = this.models
    
        users.hasOne(wallets, { as: 'wallet', foreignKey: 'group', sourceKey: 'group' });
        wallets.belongsTo(users, { as: 'user', foreignKey: 'group', targetKey: 'group' });
    
        users.hasOne(settings, { as: 'setting', foreignKey: 'group', sourceKey: 'group' });
        settings.belongsTo(users, { as: 'user', foreignKey: 'group', targetKey: 'group' });
    
        users.hasMany(logs, { as: 'logs', foreignKey: 'group', sourceKey: 'group' });
        logs.belongsTo(users, { as: 'user', foreignKey: 'group', targetKey: 'group' });
    
        users.hasMany(withdrawals, { as: 'withdrawals', foreignKey: 'group', sourceKey: 'group' });
        withdrawals.belongsTo(users, { as: 'user', foreignKey: 'group', targetKey: 'group' });

        users.hasMany(checks, { as: 'checks', foreignKey: 'group', sourceKey: 'group' });
        checks.belongsTo(users, { as: 'user', foreignKey: 'group', targetKey: 'group' });
        
        users.hasMany(invoices, { as: 'invoices', foreignKey: 'group', sourceKey: 'group' });
        invoices.belongsTo(users, { as: 'user', foreignKey: 'group', targetKey: 'group' });

        users.hasOne(balances, { as: 'balance', foreignKey: 'group', sourceKey: 'group' });
        balances.belongsTo(users, { as: 'user', foreignKey: 'group', targetKey: 'group' });
    }
}

module.exports = new Database().models
