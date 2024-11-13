const axios = require('axios');

class PriceManager {
    constructor() {
        this.prices = {}
        this.tokens = [
            { token: 'S', pair: '0xbEE32BFfb0Cd21278acd8b00786b6e840e7a7108' },
            { token: 'HITCOIN', pair: '0x139585612933fe5b3C163f6569faE29488f9ace1' }
        ];

        this.updatePrices(); 
        setInterval(() => this.updatePrices(), 60000); 
    }

    async updatePrices() {
        try {
            const pairs = this.tokens.map(token => token.pair).join(',');
            const response = await axios.get(`https://api.dexscreener.com/latest/dex/pairs/arbitrum/${pairs}`);
            
            if (response.data && response.data.pairs) {
                this.prices = response.data.pairs.reduce((acc, pair) => {
                    acc[pair.baseToken.symbol.toLowerCase()] = parseFloat(pair.priceUsd);
                    return acc;
                }, {});
                console.log('Цены обновлены:', this.prices);
            }
        } catch (error) {
            console.error('Ошибка обновления цен:', error);
        }
    }

    getPrice(symbol) {
        return this.prices[symbol.toLowerCase()] || 0;
    }
}

module.exports = new PriceManager();
