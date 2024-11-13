module.exports = function (sequelize, DataTypes) {
    const model = sequelize.define('logs', {
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

        action: {
            type: DataTypes.STRING,
            allowNull: false
        },
        
        details: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
    }, {
        tableName: 'logs', 
        timestamps: false
    });

    return model;
};