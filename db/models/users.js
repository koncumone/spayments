const generateReferralCode = (length = 10) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let referralCode = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        referralCode += characters[randomIndex];
    }

    return referralCode;
}

module.exports = function (sequelize, DataTypes) {
    const model = sequelize.define('users', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        status: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: 'user'
        },

        state: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true
        },

        group: {
            type: DataTypes.BIGINT,
            allowNull: true,
            unique: `uniqueGroup`
        },

        username: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: `uniqueCode`,
            defaultValue: () => generateReferralCode(12)
        },

        referer: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },

        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        },

    }, {
        tableName: 'users',
        timestamps: false
    });

    return model;
};