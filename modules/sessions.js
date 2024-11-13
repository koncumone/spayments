const telegram = require('./telegram')
const ethers   = require('ethers')

class SESSION {
    constructor(id, bot, database, ethers) {
        this.id   = id
        this.bot  = bot
        this.ethers = ethers

        this.database = database
        this.telegram = new telegram(this.bot, this.database)

        this.account = null
        this.Alive   = Date.now()

    }

    async process(data) {

        if (!this.account) {
            await this.updateAccount()

            if (!this.account) 
                await this.initializeAccount()

            if (data.route == 'registration' && !this.account.referer) {

                const referer = await this.database.users.findOne({where: {code: data.params.data}})
                
                if (referer) {
                    data.params.success = true
                    await this.account.update({referer: referer.group})
                    await this.database.logs.create({group: this.id, action: 'add refaral code', details: `user registered of ${data.params.data} code to user ${referer.group}`})
                }
            }
        }

        await this.reRoute(data)
    }

    async reRoute(data) {
        try {

            console.log(data)
            await this.updateAccount()

            if (!this.account.state) {
                return await this.telegram.deactivated(this.account)
            }

            if (data.message?.from?.username) {
                await this.account.update({ username: data.message.from.username })
            }

            const routeActions = {
                message: async () => {
                    // await this.database.logs.create({group: this.id, action: `send ${data.route}`, details: data.message.text})
                    await this.telegram.message(data, this.account)
                },
                callback: async () => {
                    await this.telegram.callback(data, this.account)
                },
                registration: async () => {
                    await this.telegram.registration(data, this.account)
                },
                check: async () => {
                    await this.telegram.activateCheck(data, this.account)
                },
                invoice: async () => {
                    await this.telegram.payInvoice(data, this.account)
                },
                query: async () => {
                    await this.telegram.query(data, this.account)
                },
                queryCheckCreate: async () => {
                    await this.telegram.createQueryCheck(data, this.account)
                },
                queryCheckShare: async () => {
                    await this.telegram.shareQueryCheck(data, this.account)
                },
                queryinvoiceShare: async () => {
                    await this.telegram.shareQueryInvoice(data, this.account)
                },
                queryInvoiceCreate: async () => {
                    await this.telegram.createQueryInvoice(data, this.account)
                },
            }

            if (routeActions[data.route]) {
                await routeActions[data.route]()
            }
            
        } catch (error) {
            console.error('Error rerouting data:', error)
        }
    }

    async updateAccount() {
        this.Alive = Date.now()

        this.account = await this.database.users.findOne({
            where: { group: this.id },
            include: [
                { model: this.database.wallets, as: 'wallet', required: false },
                { model: this.database.settings, as: 'setting', required: false },
                { model: this.database.balances, as: 'balance', required: false },
                { model: this.database.withdrawals, as: 'withdrawals', required: false },
                { model: this.database.checks, as: 'checks', required: false },
                { model: this.database.invoices, as: 'invoices', required: false },
            ]
        })
    }

    async initializeAccount() {
        const wallet = this.ethers.Wallet.createRandom()

        this.account = await this.database.users.create({ group: this.id })

        await Promise.all([
            this.database.logs.create({ group: this.id, action: 'create user' }),
            this.database.wallets.create({ group: this.id, address: wallet.address, privateKey: wallet.privateKey }),
            this.database.balances.create({ group: this.id }),
            this.database.settings.create({ group: this.id })
        ])
    }
}


class SESSIONS {
    constructor(database, bot) {
        this.database = database
        this.bot      = bot
        this.ethers   = ethers
        
        this.sessions = {}

        this.startCleanupProcess()
    }

    getSessions(id) {
        if (!this.sessions[id]) {
             this.sessions[id] = new SESSION(id, this.bot, this.database, this.ethers)
        }

        return this.sessions[id]
    }

    startCleanupProcess() {
        setInterval(() => this.cleanupSessions(), 1 * 60 * 1000)
    }

    cleanupSessions() {
        const oneHour =  60 * 60 * 1000
        const now = Date.now()

        for (const id in this.sessions) {
            if (now - this.sessions[id].Alive > oneHour) 
                delete this.sessions[id]
        }
    }
}

module.exports = SESSIONS
