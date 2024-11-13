module.exports = function (sequelize, DataTypes) {
    const model = sequelize.define('wallets', {
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

        address: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        privateKey: {
            type: DataTypes.STRING,
            allowNull: true,
        }

    }, {
        tableName: 'wallets', 
        timestamps: false
    });

    return model;
};