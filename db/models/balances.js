module.exports = function (sequelize, DataTypes) {
    const model = sequelize.define('balances', {
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

        s: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
                available: 0.0,
                freeze: 0.0
            }
        },

        hitcoin: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
                available: 0.0,
                freeze: 0.0
            }
        }

    }, {
        tableName: 'balances', 
        timestamps: false
    });

    return model;
};