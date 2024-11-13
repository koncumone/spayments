const generateCheckName = (length = 10) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let referralCode = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        referralCode += characters[randomIndex];
    }

    return `CH_` + referralCode;
}

module.exports = function (sequelize, DataTypes) {
    const model = sequelize.define('checks', {
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
            unique: `uniqueCheck`,
            defaultValue: () => generateCheckName(12)
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

        activations: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },

        activated: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },

        amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },

        token: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        
        recipient: {
            type: DataTypes.TEXT,
            allowNull: true,
            get() {
                const value = this.getDataValue('recipient');
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
            },
            set(value) {
                if (typeof value === 'object') {
                    this.setDataValue('recipient', JSON.stringify(value));
                } else {
                    this.setDataValue('recipient', value);
                }
            }
        },

        comment: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        
        password: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        isPremium: {
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
        tableName: 'checks', 
        timestamps: false
    });

    return model;
};