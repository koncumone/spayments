const priceManager = require('./priceManager')
const { Web3 } = require('web3');
const { Wallet } = require('ethers')


class UTILS {

    constructor (priceManager) {
        this.priceManager = priceManager
        this.web3 = new Web3()

        this.wallet = Wallet
    }

    tokenPrice(symbol) {
        return this.priceManager.prices[symbol.toLowerCase()] || 0
    }
    
    calculateUsdtPrice(amount, ticker) {
        const price = this.tokenPrice(ticker)
        return (amount * price).toFixed(2);
    };

    formatNumber(num) {
        if (num >= 1e12) {
            return (num / 1e12).toFixed(1) + 'T';
        } else if (num >= 1e9) {
            return (num / 1e9).toFixed(1) + 'B';
        } else if (num >= 1e6) {
            return (num / 1e6).toFixed(1) + 'M';
        } else if (num >= 1e3) {
            return (num / 1e3).toFixed(1) + 'K';
        } else {
            return num.toString();
        }
    };

    checkToWithdraw(balance) {
        const tokens = { ...balance.dataValues };
        delete tokens.id;
        delete tokens.group;

        for (const [tokenName, amount] of Object.entries(tokens)) {
            if (amount.available - amount.freeze > 0) {
                return true;
            }
        }
    
        return false
    }

    checkToQueryCheck(balance) {
        const tokens = { ...balance.dataValues };
        delete tokens.id;
        delete tokens.group;
    
        const availableBalances = [];
    
        for (const [tokenName, amount] of Object.entries(tokens)) {
            const availableAmount = amount.available - amount.freeze;
            if (availableAmount > 0) {
                availableBalances.push({
                    token: tokenName,
                    amount: availableAmount
                });
            }
        }
    
        return availableBalances;
    }

    checkStringLength(inputString) {
        if (inputString.length > 512) 
            return inputString.substring(0, maxLength)

        return inputString
    }

    checkAvailableBalance(available, freeze) {

        if (available - freeze > 0)
            return available - freeze

        return false
    }


    replaceNonDigits(inputString) {
        return inputString
            .replace(/[^\d.,]+/g, '') 
            .replace(/,/g, '.')
            .replace(/(\..*?)\./g, '\$1'); 
    }

    checkToValidAddress(address) {
        if (!this.web3.utils.isAddress(address))
            return false

        return true
    }

    updateBalance(obj, operation, amount) {
        const newObj = { ...obj };
    
        switch (operation) {
            case 'addToFreeze':
                newObj.freeze += amount;
                break;
            case 'addToBalance':
                newObj.available += amount;
                break;
            case 'removeFromFreeze':
                newObj.freeze -= amount;
                break;
            case 'removeFromBalance':
                newObj.available -= amount;
                break;
            case 'removeFromFreezeAndBalance':
                newObj.freeze -= amount;
                newObj.available -= amount;
                break;
            default:
                throw new Error('Invalid operation');
        }
    
        return newObj;
    }

    formatDate(date) {
        const year = date.getUTCFullYear();
        const month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
        const day = ('0' + date.getUTCDate()).slice(-2);
        const hours = ('0' + date.getUTCHours()).slice(-2);
        const minutes = ('0' + date.getUTCMinutes()).slice(-2);
        const seconds = ('0' + date.getUTCSeconds()).slice(-2);
      
        return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    }

    recipientData(data) {
        let recipient = null

        if (data.message.forward_from) {
            if (data.message.forward_from.is_bot) {
                return {recipient, error: 'Пользователь не может быть ботом'}
            }

            if (data.message.forward_from.type == 'hidden_user') {
                return {recipient, error: 'Недействительный @⁠username или в пересланном сообщении отсутствует ссылка на аккаунт из-за настроек конфиденциальности Telegram этого пользователя.'}
            }
            
            return {recipient: data.message.forward_from, error: null}
        }

        if (data.message.text) {

            if (!data.message.entities) {
                return {recipient, error: 'Недействительный @⁠username или в пересланном сообщении отсутствует ссылка на аккаунт из-за настроек конфиденциальности Telegram этого пользователя.'}
            }

            if (data.message.entities) {
                const mentionEntity = data.message.entities.find(entity => entity.type === 'mention');

                if (mentionEntity) {
                    return {error: null, recipient: data.message.text.substring(mentionEntity.offset, mentionEntity.offset + mentionEntity.length)}
                } else {
                    return {recipient, error: 'Недействительный @⁠username или в пересланном сообщении отсутствует ссылка на аккаунт из-за настроек конфиденциальности Telegram этого пользователя.'}
                }
            }
        }
    }

    formatUserString(user) {
        if (typeof user == 'string') {
            return user
        }
        
        if (user.username) {
            return `@${user.username}`;
        } 
        
        if (user.first_name) {
            return `[${user.first_name}](tg://user?id=${user.id})`;
        }

        if (user.last_name) {
            return `[${user.last_name}](tg://user?id=${user.id})`;
        }
        
        return `[${user.id}](tg://user?id=${user.id})`;
    }

    parseQuery(query) {
        const parts = query.split(' ');
    
        let amount = null;
        let recipient = null;
        let comment = null;
    
        if (parts.length > 0 && !isNaN(parts[0])) {
            amount = parseFloat(parts[0]);
        }
    
        if (parts.length > 1 && parts[1].startsWith('@')) {
            recipient = parts[1];
        }
    
        if (parts.length > 2) {
            comment = parts.slice(2).join(' ');
        }
    
        return { amount, recipient, comment };
    }

    parseQueryInvoice(query) {
        const parts = query.split(' ');

        let amount = null;
        let token = null;
    
        if (parts.length > 0 && !isNaN(parts[0])) {
            amount = parseFloat(parts[0]);
        }
    
        if (parts.length > 1) {
            token = parts[1];
        }
    
        return { amount, token };
    }
}

module.exports = new UTILS(priceManager)