const generateInvoiceName = (length = 10) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let referralCode = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        referralCode += characters[randomIndex];
    }

    return `INV_` + referralCode;
}

module.exports = function (sequelize, DataTypes) {
    const model = sequelize.define('invoices', {
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

        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: `uniqueInvoice`,
            defaultValue: () => generateInvoiceName(12)
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'active'
        },

        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'single'
        },

        amount: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },

        minimal: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },

        payed: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: 0.0
        },

        payers: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },

        token: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        
        hideMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        forward: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        isComments: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },

        inline_messages: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },

        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        },

    }, {
        tableName: 'invoices', 
        timestamps: false
    });

    return model;
};