module.exports = function (sequelize, DataTypes) {
    const model = sequelize.define('withdrawals', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        group: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: 'users', 
                key: 'group'
            }
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'pending'

        },

        address: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        amount: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },

        token: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        
        txid: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        },

        finishedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },


    }, {
        tableName: 'withdrawals', 
        timestamps: false
    });

    return model;
};