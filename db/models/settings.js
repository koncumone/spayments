module.exports = function (sequelize, DataTypes) {
    const model = sequelize.define('settings', {
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

        percent: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 5 
        },

    }, {
        tableName: 'settings', 
        timestamps: false
    });

    return model;
};