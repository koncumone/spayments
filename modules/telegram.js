const interfaces = require('./interfaces'),
      keyboards  = require('./keyboards')

const utils      = require('./utils')

class TELEGRAM {
    constructor(bot, database) {
        this.bot        = bot    
        this.database   = database

        this.interfaces = interfaces
        this.keyboards  = keyboards
        this.utils      = utils

        this.state      = {}
    }

    async message(data, account) {

        if (['/subscriptions', '/taxesInfo', '/invoices', '/raffles', '/referals', '/spay'].includes(data.message.text)) {
            this.bot.deleteMessage(account.group, data.message.message_id)
            
            const { message, keyboard } = this.interfaces.taxesInfo()
            return this.state.activeMessage = (await this.bot.sendMessage(account.group, message, { ...keyboard })).message_id
        }

        if (data.message.text == '/start' || data.message.text == '/menu') {
            this.bot.deleteMessage(account.group, data.message.message_id)
            
            const { message, keyboard } = this.interfaces.menu()
            return this.state.activeMessage = (await this.bot.sendMessage(account.group, message, { ...keyboard })).message_id
        }

        if (data.message.text == '/wallet') {
            this.bot.deleteMessage(account.group, data.message.message_id)

            const { message, keyboard } = this.interfaces.wallet(account)
            return this.state.activeMessage = (await this.bot.sendMessage(account.group, message, { ...keyboard })).message_id
        }

        if (data.message.text == '/checks') {
            delete this.state.check

            this.bot.deleteMessage(account.group, data.message.message_id)

            const { message, keyboard } = this.interfaces.preChecks(account.checks)
            return this.state.activeMessage = (await this.bot.sendMessage(account.group, message, { ...keyboard })).message_id
        }

        if (this.state?.withdraw && this.state?.withdraw.state == 'enter_amount') {
            this.bot.deleteMessage(account.group, data.message.message_id)

            const replacedText = this.utils.replaceNonDigits(data.message.text)

            if (!replacedText || parseFloat(replacedText) < this.interfaces.minimals[this.state.withdraw.token].withdrawNumber)
                return this.bot.editMessageText(`Вывод\n\nМинимальная сумма для вывода ${this.interfaces.minimals[this.state.withdraw.token].withdrawDisplay}`, {chat_id: account.group, message_id: this.state.withdraw.message, ...this.keyboards.back(`withdraw_${this.state.withdraw.token}`)})
        
            const availableBalance = this.utils.checkAvailableBalance(account.balance[this.state.withdraw.token].available, account.balance[this.state.withdraw.token].freeze)
            
            if (!replacedText || parseFloat(replacedText) > availableBalance)
                return this.bot.editMessageText(`Вывод\n\nМаксимальная сумма для вывода ${availableBalance} ${this.state.withdraw.token.toUpperCase()}`, {chat_id: account.group, message_id: this.state.withdraw.message, ...this.keyboards.back(`withdraw_${this.state.withdraw.token}`)})
            
            this.state.withdraw = {
                ...this.state.withdraw,
                amount: parseFloat(replacedText),
                state: 'enter_wallet'
            }

            return this.bot.editMessageText(`Вывод\n\nВведите адрес кошелька в сети Arbitrum, куда вы хотите вывести ${replacedText} ${this.state.withdraw.token.toUpperCase()}`, {chat_id: account.group, message_id: this.state.withdraw.message, ...this.keyboards.back(`withdraw_${this.state.withdraw.token}`)})
        }  
        
        if (this.state?.withdraw && this.state?.withdraw.state == 'enter_wallet') {
            this.bot.deleteMessage(account.group, data.message.message_id)
        
            const checkAddress = this.utils.checkToValidAddress(data.message.text)

            if (!checkAddress)
                return this.bot.editMessageText(`Вывод\n\nВведенный вами адрес не валидный, проверьте введенный вами адрес, и повторите`, {chat_id: account.group, message_id: this.state.withdraw.message, ...this.keyboards.back(`withdraw_${this.state.withdraw.token}`)})

            if (data.message.text.toLowerCase() == account.wallet.address.toLowerCase()) 
                return this.bot.editMessageText(`Вывод\n\nВы не можете вывести средства на собственный кошелек\n\nВведите другой адрес кошелька`, {chat_id: account.group, message_id: this.state.withdraw.message, ...this.keyboards.back(`withdraw_${this.state.withdraw.token}`)})

            this.state.withdraw = {
                ...this.state.withdraw,
                address: data.message.text,
                state: 'wait_confirmation'
            }

            const { message, keyboard } = this.interfaces.confirmWithdraw(this.state.withdraw)
            return this.bot.editMessageText(message, {chat_id: account.group, message_id: this.state.withdraw.message, ...keyboard})
        }

        if (this.state?.check && this.state?.check.state == 'enter_amount') {
            this.bot.deleteMessage(account.group, data.message.message_id)

            const replacedText = this.utils.replaceNonDigits(data.message.text)

            if (!replacedText || parseFloat(replacedText) < this.interfaces.minimals[this.state.check.token].checkNumber)
                return this.bot.editMessageText(`Минимальная сумма для создания чека ${this.interfaces.minimals[this.state.check.token].checkDisplay}`, {chat_id: account.group, message_id: this.state.check.message, ...this.keyboards.back(`createCheck_amount_${this.state.check.token}`)})
        
            const availableBalance = this.utils.checkAvailableBalance(account.balance[this.state.check.token].available, account.balance[this.state.check.token].freeze)
        
            if (!replacedText || parseFloat(replacedText) > availableBalance)
                return this.bot.editMessageText(`Максимальная сумма для создания чека ${availableBalance} ${this.state.check.token}`, {chat_id: account.group, message_id: this.state.check.message, ...this.keyboards.back(`createCheck_amount_${this.state.check.token}`)})
       
            this.state.check = {
                ...this.state.check,
                state: 'enter_qty',
                amount: parseFloat(replacedText)
            }

            const { message, keyboard } = this.interfaces.qtyCheck(this.state.check.token, account.balance, parseFloat(replacedText))
            return this.bot.editMessageText(message, {chat_id: account.group, message_id: this.state.check.message, ...keyboard})
        }

        if (this.state?.check && this.state?.check.state == 'enter_qty') {
            this.bot.deleteMessage(account.group, data.message.message_id)

            const replacedText = this.utils.replaceNonDigits(data.message.text)

            if (!replacedText || parseInt(replacedText) < 1)
                return this.bot.editMessageText(`Минимальная количество активаций не может быть меньше 1`, {chat_id: account.group, message_id: this.state.check.message, ...this.keyboards.back(`createCheck_qty_${this.state.check.token}_${this.state.check.amount}`)})

            const availableBalance = this.utils.checkAvailableBalance(account.balance[this.state.check.token].available, account.balance[this.state.check.token].freeze)
            
            if (!replacedText || parseInt(replacedText) > (availableBalance / this.state.check.amount).toFixed(0))
                return this.bot.editMessageText(`Максимальное количество активаций не может быть больше ${(availableBalance / this.state.check.amount).toFixed(0)}`, {chat_id: account.group, message_id: this.state.check.message, ...this.keyboards.back(`createCheck_qty_${this.state.check.token}_${this.state.check.amount}`)})
        
            this.state.check = {
                ...this.state.check,
                state: 'toCreate',
                qty: parseInt(replacedText),
                type: parseInt(replacedText) == 1 ? 'single' : 'multi'
            }

            await this.createCheck(account, this.state.check.message)
        }

        if (this.state?.checkManage && this.state?.checkManage.state == 'enter_comment') {
            this.bot.deleteMessage(account.group, data.message.message_id)

            const replacedText = this.utils.checkStringLength(data.message.text)

            const check = await this.database.checks.findByPk(this.state.checkManage.id)
            await check.update({comment: replacedText})
            
            const { message, keyboard } = this.interfaces.checkInfo(check)
            return this.bot.editMessageText(message, {chat_id: account.group, message_id: this.state.checkManage.message, ...keyboard})
        }

        if (this.state?.checkRestricts && this.state?.checkRestricts.state == 'enter_user') {
            this.bot.deleteMessage(account.group, data.message.message_id)

            const { recipient, error } = this.utils.recipientData(data)

            if (error)
                return this.bot.editMessageText(error, {chat_id: account.group, message_id: this.state.checkRestricts.message, ...this.keyboards.back(`checkRestricts_${this.state.checkRestricts.id}_user_pin`)})

            const check = await this.database.checks.findByPk(this.state.checkRestricts.id)
            await check.update({recipient})

            const { message, keyboard } = this.interfaces.checkRestricts(check)
            return this.bot.editMessageText(message, {chat_id: account.group, message_id: this.state.checkRestricts.message, ...keyboard })
        }
        
        if (this.state?.checkRestricts && this.state?.checkRestricts.state == 'enter_password') {
            this.bot.deleteMessage(account.group, data.message.message_id)

            const replacedText = this.utils.checkStringLength(data.message.text)

            const check = await this.database.checks.findByPk(this.state.checkRestricts.id)
            await check.update({password: replacedText})
            
            const { message, keyboard } = this.interfaces.checkRestricts(check)
            return this.bot.editMessageText(message, {chat_id: account.group, message_id: this.state.checkRestricts.message, ...keyboard})
        }

        if (this.state?.checkActivate && this.state?.checkActivate.state == 'check_password') {
            this.bot.deleteMessage(account.group, data.message.message_id)

            if (data.message.text != this.state.checkActivate.password)
                return this.bot.sendMessage(account.group, `Не правильный пароль, повторите попытку`, {reply_markup: {inline_keyboard: [[{text: 'Меню', callback_data: 'menu'}]]}})
         

            await this.checkActivateConfirm(this.state.checkActivate.id, account)
        }

        if (this.state?.invoice && this.state?.invoice.state == 'enter_amount') {
            this.bot.deleteMessage(account.group, data.message.message_id)

            const replacedText = this.utils.replaceNonDigits(data.message.text)

            this.state.invoice = {
                ...this.state.invoice,
                amount: parseFloat(replacedText),
                state: 'createInvoice'
            }
            
            await this.createInvoice(account, this.state.invoice.message)
        }

        
        if (this.state?.invoiceManage && this.state?.invoiceManage.state == 'enter_description') {
            this.bot.deleteMessage(account.group, data.message.message_id)

            const replacedText = this.utils.checkStringLength(data.message.text)

            const invoice = await this.database.invoices.findByPk(this.state.invoiceManage.id)
            await invoice.update({description: replacedText})
            
            this.state.invoiceManage = {
                ...this.state.invoiceManage,
                state: 'done'
            }

            const { message, keyboard } = this.interfaces.invoiceInfo(invoice)
            return this.bot.editMessageText(message, {chat_id: account.group, message_id: this.state.invoiceManage.message, ...keyboard})
        }

        if (this.state?.invoiceManage && this.state?.invoiceManage.state == 'enter_hideMessage') {
            this.bot.deleteMessage(account.group, data.message.message_id)

            const replacedText = this.utils.checkStringLength(data.message.text)

            const invoice = await this.database.invoices.findByPk(this.state.invoiceManage.id)
            await invoice.update({hideMessage: replacedText})
            
            this.state.invoiceManage = {
                ...this.state.invoiceManage,
                state: 'done'
            }

            const { message, keyboard } = this.interfaces.invoiceInfo(invoice)
            return this.bot.editMessageText(message, {chat_id: account.group, message_id: this.state.invoiceManage.message, ...keyboard})
        }

        if (this.state?.invoiceData && this.state?.invoiceData.state == 'enter_amount') {
            this.bot.deleteMessage(account.group, data.message.message_id)

            const replacedText = this.utils.replaceNonDigits(data.message.text),
                  max          = this.state.invoiceData.amount ? this.state.invoiceData.amount - this.state.invoiceData.payed : 'infinity',
                  min          = this.state.invoiceData?.minimal

            if (!replacedText || parseFloat(replacedText) < min)
                return this.bot.editMessageText(`Минимальная сумма для оплаты этого счета ${this.state.invoiceData?.minimal} ${this.state.invoiceData.token.toUpperCase()}`, {chat_id: account.group, message_id: this.state.invoiceData.message,...this.keyboards.back(`userInvoiceManage_${this.state.invoiceData.id}_amount_change`)})

            if (!replacedText || (parseFloat(replacedText) > max && max != 'infinity'))
                return this.bot.editMessageText(`Максимальная сумма для оплаты этого счета ${max} ${this.state.invoiceData.token.toUpperCase()}`, {chat_id: account.group, message_id: this.state.invoiceData.message,...this.keyboards.back(`userInvoiceManage_${this.state.invoiceData.id}_amount_change`)})

            this.state.invoiceData = {
                ...this.state.invoiceData,
                userAmount: parseFloat(replacedText),
                state: 'enteredAmount'
            }

            const invoice  = await this.database.invoices.findOne({where: {id: this.state.invoiceData.id}})

            const { message, keyboard } = this.interfaces.prePayInvoice(invoice, account.balance[invoice.token], this.state.invoiceData)
            return this.bot.editMessageText(message, {chat_id: account.group, message_id: this.state.invoiceData.message, ...keyboard })
        }

        if (this.state?.invoiceData && this.state?.invoiceData.state == 'enter_comment') {
            this.bot.deleteMessage(account.group, data.message.message_id)

            const replacedText = this.utils.checkStringLength(data.message.text)

            this.state.invoiceData = {
                ...this.state.invoiceData,
                comment: replacedText,
                state: 'enteredComment'
            }

            const invoice  = await this.database.invoices.findOne({where: {id: this.state.invoiceData.id}})

            const { message, keyboard } = this.interfaces.prePayInvoice(invoice, account.balance[invoice.token], this.state.invoiceData)
            return this.bot.editMessageText(message, {chat_id: account.group, message_id: this.state.invoiceData.message, ...keyboard })
        }
    }

    async callback(data, account) {

        const MessageText     = data.message.data,
              ChatId          = data.message.message.chat.id,
              MessageId       = data.message.message.message_id;
        

        // if (this.state.activeMessage != MessageId) {
        //     this.bot.deleteMessage(ChatId, MessageId)
            
        //     const { message, keyboard } = this.interfaces.menu()

        //     return this.state.activeMessage = (await this.bot.sendMessage(ChatId, message, { ...keyboard })).message_id
        // }
            

        if (MessageText == 'menu') {
            delete this.state.checkActivate

            const { message, keyboard } = this.interfaces.menu()
            return this.bot.editMessageText(message, {chat_id: ChatId, message_id: MessageId, ...keyboard })
        }

        if (MessageText == 'wallet') {
            const { message, keyboard } = this.interfaces.wallet(account)
            return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
        }

        

        if (MessageText == 'withdraw') {
            delete this.state.withdraw

            const checkBalances = this.utils.checkToWithdraw(account.balance)

            if (!checkBalances)
                return this.bot.answerCallbackQuery(data.message.id, 'Нет доступных токенов для вывода', true)

            const { message, keyboard } = this.interfaces.preWithdraw('withdraw')
            return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
        }

        if (MessageText.startsWith('withdraw_')) {

            const getAvailableBalance = this.utils.checkAvailableBalance(account.balance[MessageText.split('_')[1]].available,  - account.balance[MessageText.split('_')[1]].freeze)

            if (getAvailableBalance == 0)
                return this.bot.answerCallbackQuery(data.message.id, 'Нет доступных токенов для вывода', true)

            const { message, keyboard } = this.interfaces.withdraw(MessageText.split('_')[1])
         
            this.state.withdraw = {
                state: 'enter_amount',
                token: MessageText.split('_')[1],
                message: MessageId
            };

            return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
        }

        if (MessageText == 'confirmWithdraw') {
            if (!this.state.withdraw)  
                return this.bot.editMessageText(`Внутренняя ошибка. Обратитесь в поддержку`, {chat_id: ChatId, message_id: MessageId, ...this.keyboards.support()})
        
            const [ request, balance, logs ] = await Promise.all([
                this.database.withdrawals.create({
                    group: account.group,
                    address: this.state.withdraw.address,
                    amount: this.state.withdraw.amount,
                    token: this.state.withdraw.token,
                }),
                account.balance.update({[this.state.withdraw.token]: this.utils.updateBalance(account.balance[this.state.withdraw.token], 'addToFreeze', this.state.withdraw.amount)}),
                this.database.logs.create({group: account.group, action: 'create withdrawal', details: `create withdrawal request ${this.state.withdraw.amount} ${this.state.withdraw.token} to address ${this.state.withdraw.address}`})
            ])

            delete this.state.withdraw

            return this.bot.editMessageText(`Ваша заявка на вывод была успешно создана. Вывод средств занимает от 15 минут до 24 часов`, {chat_id: ChatId, message_id: MessageId, ...this.keyboards.successWithdrawal(request.id)})
        }

        if (MessageText == 'deposite') {
            const { message, keyboard } = this.interfaces.preDeposite('deposite')
            return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
        }

        if (MessageText.startsWith('deposite_')) {
            const { message, keyboard } = this.interfaces.deposite(MessageText.split('_')[1], account.wallet.address)
            return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
        }

if (['subscriptions', 'taxesInfo', 'raffles', 'referals', 'spay'].includes(MessageText)) {
    const { message, keyboard } = this.interfaces.taxesInfo()
    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
}

        if (MessageText == 'withdrawalRequests') {
            const { message, keyboard } = this.interfaces.withdrawalRequests(account.withdrawals)
            return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
        }

        if (MessageText.startsWith('history')) {
            const route = MessageText.split('_')[1],
                  id    = MessageText.split('_')[2]

            if (route == 'withdrawals') {
                const { message, keyboard } = this.interfaces.withdrawalInfo(account.withdrawals.find(withdrawal => withdrawal.id == id))
                return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
            }
        }

        if (MessageText == 'invoices') {
            delete this.state.invoice

            const { message, keyboard } = this.interfaces.preInvoice(account.invoices)
            return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
        }

        if (MessageText == 'checks') {
            delete this.state.check

            const { message, keyboard } = this.interfaces.preChecks(account.checks)
            return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
        }

        if (MessageText == 'createInvoice') {
            const { message, keyboard } = this.interfaces.typeInvoice()
            return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
        }

        if (MessageText.startsWith('createInvoice_')) {
            const action = MessageText.split('_')[1]

            if (action == 'type') {
                const { message, keyboard } = this.interfaces.tokenInvoice(MessageText.split('_')[2])
                return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
            }

            if (action == 'token') {
                this.state.invoice = {
                    state: 'enter_amount',
                    token: MessageText.split('_')[3],
                    type: MessageText.split('_')[2],
                    message: MessageId
                }

                const { message, keyboard } = this.interfaces.amountInvoice(MessageText.split('_')[2], MessageText.split('_')[3])
                return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
            }

            if (action == 'amount') {
                this.state.invoice = {
                    ...this.state.invoice,
                    amount: MessageText.split('_')[4],
                    state: 'createInvoice'
                }

                await this.createInvoice(account, MessageId)
            }
        }

        if (MessageText == 'createCheck') {
            const { message, keyboard } = this.interfaces.tokenCheck()
            return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
        }

        if (MessageText.startsWith('createCheck_')) {
            const action = MessageText.split('_')[1]
            
            if (action == 'amount') {
                const checkAvailableBalance = this.utils.checkAvailableBalance(account.balance[MessageText.split('_')[2]].available, account.balance[MessageText.split('_')[2]].freeze)

                if (checkAvailableBalance == 0 || checkAvailableBalance < this.interfaces.minimals[MessageText.split('_')[2]].checkNumber)
                    return this.bot.answerCallbackQuery(data.message.id, 'Недостаточно токенов для создания чека', true)


                this.state.check = {
                    state: 'enter_amount',
                    token: MessageText.split('_')[2],
                    message: MessageId
                }

                const { message, keyboard } = this.interfaces.amountCheck(MessageText.split('_')[2], account.balance)
                return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
            }

            if (action == 'qty') {
                this.state.check = {
                    ...this.state.check,
                    state: 'enter_qty',
                    amount: parseFloat(MessageText.split('_')[3])
                }

                const { message, keyboard } = this.interfaces.qtyCheck(MessageText.split('_')[2], account.balance, parseFloat(MessageText.split('_')[3]))
                return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
            }

            if (action == 'create') {
                this.state.check = {
                    ...this.state.check,
                    state: 'toCreate',
                    qty: parseFloat(MessageText.split('_')[4]),
                    type: MessageText.split('_')[3]
                }

                await this.createCheck(account, MessageId)
            }
        }

        if (MessageText == 'activeChecks') {
            const { message, keyboard } = this.interfaces.activeChecks(account.checks)
            return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
        }

        if (MessageText == 'activeInvoices') {
            const { message, keyboard } = this.interfaces.activeInvoices(account.invoices)
            return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
        }

        if (MessageText.startsWith('invoiceInfo_')) {
            const invoice = account.invoices.find(invoice => invoice.id == MessageText.split('_')[1])
        
            if (!invoice)
                return this.bot.answerCallbackQuery(data.message.id, 'Этого счета нету в списке ваших счетов', true)

            const { message, keyboard } = this.interfaces.invoiceInfo(invoice)
            return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
        }

        if (MessageText.startsWith('invoiceManage_')) {
            delete this.state.invoiceManage

            const action   = MessageText.split('_')[2]
            const invoice  = await this.database.invoices.findOne({where: {id: MessageText.split('_')[1]}})
            
            if (action == 'comments') {
                await invoice.update({isComments: !invoice.isComments})

                const { message, keyboard } = this.interfaces.invoiceInfo(invoice)
                return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
            }

            if (action == 'description') {

                if (MessageText.split('_')[3] == 'add') {
                    this.state.invoiceManage = {
                        id: invoice.id,
                        message: MessageId,
                        state: 'enter_description'
                    }

                    const { message, keyboard } = this.interfaces.invoiceDescription(invoice.id)
                    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
                }

                if (MessageText.split('_')[3] == 'remove') {
                    await Promise.all([
                        this.bot.answerCallbackQuery(data.message.id, 'Описание удалено', false),
                        invoice.update({description: null})
                    ])

                    const { message, keyboard } = this.interfaces.invoiceInfo(invoice)
                    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
                }
            }

            if (action == 'hide') {
                if (MessageText.split('_')[3] == 'add') {
                    this.state.invoiceManage = {
                        id: invoice.id,
                        message: MessageId,
                        state: 'enter_hideMessage'
                    }

                    const { message, keyboard } = this.interfaces.invoiceHideMessage(invoice.id)
                    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
                }

                if (MessageText.split('_')[3] == 'remove') {
                    await Promise.all([
                        this.bot.answerCallbackQuery(data.message.id, 'Скрытое сообщение удалено', false),
                        invoice.update({hideMessage: null})
                    ])

                    const { message, keyboard } = this.interfaces.invoiceInfo(invoice)
                    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
                }
            }

            if (action == 'delete') {
                if (MessageText.split('_')[3] == 'quote') {
                    const { message, keyboard } = this.interfaces.invoiceDelete(invoice.id)
                    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
                }

                if (MessageText.split('_')[3] == 'yes') {
                    await Promise.all([
                        this.bot.answerCallbackQuery(data.message.id, 'Чек удален', false),
                        invoice.destroy(),
                    ]) 

                    const { message, keyboard } = this.interfaces.activeInvoices(account.invoices.filter(invoice => invoice.id != MessageText.split('_')[1]))
                    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
                }
            }
        }

        if (MessageText.startsWith('checkInfo_')) {
            delete this.state.checkManage

            const check = account.checks.find(check => check.id == MessageText.split('_')[1])

            if (!check)
                return this.bot.answerCallbackQuery(data.message.id, 'Этого чека нету в списке ваших чеков', true)

            const { message, keyboard } = this.interfaces.checkInfo(check)
            return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
        }

        if (MessageText.startsWith('checkManage_')) {
            delete this.state.checkRestricts

            const action = MessageText.split('_')[2]
            const check  = await this.database.checks.findOne({where: {id: MessageText.split('_')[1]}})

            if (!check) {
                await this.bot.answerCallbackQuery(data.message.id, 'Этого чека нету в списке ваших чеков', true)

                const { message, keyboard } = this.interfaces.activeChecks([])
                return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
            }

            if (action == 'text') {
                if (MessageText.split('_')[3] == 'add') {
                    this.state.checkManage = {
                        id: check.id,
                        message: MessageId,
                        state: 'enter_comment'
                    }

                    const { message, keyboard } = this.interfaces.checkComment(check.id)
                    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
                }

                if (MessageText.split('_')[3] == 'remove') {
                    
                    await Promise.all([
                        this.bot.answerCallbackQuery(data.message.id, 'Описание удалено', false),
                        check.update({comment: null})
                    ])

                    const { message, keyboard } = this.interfaces.checkInfo(check)
                    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
                }
            }

            if (action == 'restricts') {
                const { message, keyboard } = this.interfaces.checkRestricts(check)
                return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
            }

            if (action == 'delete') {

                if (MessageText.split('_')[3] == 'quote') {
                    const { message, keyboard } = this.interfaces.checkDelete(check.id)
                    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
                }

                if (MessageText.split('_')[3] == 'yes') {
                    await Promise.all([
                        this.bot.answerCallbackQuery(data.message.id, 'Чек удален', false),
                        account.balance.update({[check.token]: this.utils.updateBalance(account.balance[check.token], 'removeFromFreeze', (check.amount * (check.activations - check.activated.length)))}),
                        check.destroy(),
                    ]) 

                    const { message, keyboard } = this.interfaces.activeChecks(account.checks.filter(check => check.id != MessageText.split('_')[1]))
                    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
                }

            }
        }

        if (MessageText.startsWith('checkRestricts_')) {
            const action = MessageText.split('_')[2]
            const check  = await this.database.checks.findOne({where: {id: MessageText.split('_')[1]}})
        
            if (action == 'premium') {
                await check.update({isPremium: !check.isPremium})

                const { message, keyboard } = this.interfaces.checkRestricts(check)
                return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
            }

            if (action == 'user') {
                if (MessageText.split('_')[3] == 'pin') {
                    this.state.checkRestricts = {
                        id: check.id,
                        message: MessageId,
                        state: 'enter_user'
                    }

                    const { message, keyboard } = this.interfaces.checkUser(check.id)
                    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
                }

                if (MessageText.split('_')[3] == 'unpin') {
                    await Promise.all([
                        this.bot.answerCallbackQuery(data.message.id, 'Пользоватеть откреплен', false),
                        check.update({recipient: null})
                    ])

                    const { message, keyboard } = this.interfaces.checkRestricts(check)
                    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
                }
            }

            if (action == 'password') {
                if (MessageText.split('_')[3] == 'add') {
                    this.state.checkRestricts = {
                        id: check.id,
                        message: MessageId,
                        state: 'enter_password'
                    }

                    const { message, keyboard } = this.interfaces.checkPassword(check.id)
                    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
                }

                if (MessageText.split('_')[3] == 'remove') {
                    await Promise.all([
                        this.bot.answerCallbackQuery(data.message.id, 'Пароль убран', false),
                        check.update({password: null})
                    ])

                    const { message, keyboard } = this.interfaces.checkRestricts(check)
                    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
                }
            }
        }

        if (MessageText.startsWith(`userInvoiceManage_`)) {
            const action   = MessageText.split('_')[2]
            const invoice  = await this.database.invoices.findOne({where: {id: MessageText.split('_')[1]}})

            if (action == 'amount') {
                this.state.invoiceData = {
                    ...this.state.invoiceData,
                    state: 'enter_amount'
                }

                const { message, keyboard } = this.interfaces.userInvoiceAmount(this.state.invoiceData, account.balance[this.state.invoiceData.token])
                return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
            }

            if (action == 'comment') {

                if (MessageText.split('_')[3] == 'add') {
                    this.state.invoiceData = {
                        ...this.state.invoiceData,
                        id: MessageText.split('_')[1],
                        state: 'enter_comment',
                        message: MessageId,
                    }

                    const { message, keyboard } = this.interfaces.userInvoiceComment(invoice.id)
                    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
                }

                if (MessageText.split('_')[3] == 'remove') {
                    this.state.invoiceData = {
                        ...this.state.invoiceData,
                        state: 'deleteComment',
                        message: MessageId,
                        comment: null
                    }

                    const { message, keyboard } = this.interfaces.prePayInvoice(invoice, account.balance[invoice.token], this.state.invoiceData)
                    return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
                }
            }

            if (action == 'show') {
                const { message, keyboard } = this.interfaces.prePayInvoice(invoice, account.balance[invoice.token], this.state.invoiceData)
                return this.bot.editMessageText(message, {chat_id: ChatId, message_id:MessageId, ...keyboard })
            }
        }

        if (MessageText.startsWith('payInvoice_')) {

            if (!this.state.invoiceData) {
                const { message, keyboard } = this.interfaces.menu()
                return this.bot.editMessageText(message, {chat_id: ChatId, message_id: MessageId, ...keyboard })
            }

            delete this.state.invoiceData 

            const invoice  = await this.database.invoices.findOne({where: {id: MessageText.split('_')[1]}})

            if (!invoice || invoice.status != 'active')
                return this.bot.editMessageText(`Счет не найден, удалён или не был создан`, {chat_id: ChatId, message_id:MessageId, reply_markup: {inline_keyboard: [[{text: 'Меню', callback_data: 'menu'}]]} })

            if (invoice.type == 'multi') {
                if (invoice.amount && invoice.amount - invoice.payed < parseFloat(MessageText.split('_')[2]))
                    return this.bot.editMessageText(`Не удалось оплатить счет. Остаточная сумма чека меньше, чем вы пытаетесь оплатить`, {chat_id: ChatId, message_id:MessageId, reply_markup: {inline_keyboard: [[{text: 'Меню', callback_data: 'menu'}]]} })
            }

            const invoiceOwner = await this.database.balances.findOne({where: {group: invoice.group}})
            
            await Promise.all([
                invoice.update({payers: [...invoice.payers, account.group], payed: invoice.payed + parseFloat(MessageText.split('_')[2])}),
                invoiceOwner.update({[invoice.token]: this.utils.updateBalance(invoiceOwner[invoice.token], 'addToBalance', parseFloat(MessageText.split('_')[2]))}),
                account.balance.update({[invoice.token]: this.utils.updateBalance(account.balance[invoice.token], 'removeFromBalance', parseFloat(MessageText.split('_')[2]))})
            ])

            await Promise.all([
                this.bot.sendMessage(invoice.group, `${this.utils.formatUserString(data.message.from)} оплатил ваш счет за ${MessageText.split('_')[2]} ${invoice.token.toUpperCase()}`),
                this.bot.editMessageText(`Вы оплатили счет за ${MessageText.split('_')[2]} ${invoice.token.toUpperCase()}`,  {chat_id: ChatId, message_id: MessageId, reply_markup: {inline_keyboard: [[{ text: '◂ Назад', callback_data: `menu` }]]}})
            ])

            if (invoice.type == 'single')
                await invoice.destroy()

            if (invoice.type == 'multi' && invoice.amount && invoice.amount - invoice.payed == 0) 
                await invoice.destroy()
        }
    }

    async payInvoice(data, account) {
        const invoice = await this.database.invoices.findOne({where: {name: `INV_${data.params.data}`}})

        if (!invoice || invoice.status != 'active')
            return this.bot.sendMessage(account.group, `Счет не найден, удалён или не был создан`, {reply_markup: {inline_keyboard: [[{text: 'Меню', callback_data: 'menu'}]]}})

        if (invoice.group == account.group)
            return this.bot.sendMessage(account.group, `Вы не можете оплатить собственный чек`, {reply_markup: {inline_keyboard: [[{text: 'Меню', callback_data: 'menu'}]]}})

        this.state.invoiceData = this.state.invoiceData || {}

        if (invoice.type == 'multi') {
            this.state.invoiceData = {
                ...this.state.invoiceData,
                state: 'enter_amount',
                minimal: invoice.minimal,
                token: invoice.token,
                amount: invoice.amount,
                payed: invoice.payed,
                id: invoice.id,
            }

            const { message, keyboard } = this.interfaces.userInvoiceAmount(this.state.invoiceData, account.balance[invoice.token])
            return this.state.invoiceData.message = (await this.bot.sendMessage(account.group, message, { ...keyboard })).message_id
        }

        const { message, keyboard } = this.interfaces.prePayInvoice(invoice, account.balance[invoice.token], this.state.invoiceData)
        return this.bot.sendMessage(account.group, message, { ...keyboard })
    }

    async createInvoice(account, MessageId) {
        const invoice = await this.database.invoices.create({
            group: account.group,
            type: this.state.invoice.type,
            token: this.state.invoice.token,
            amount: this.state.invoice.amount == 'infinity' ? null : this.state.invoice.amount,
        })

        delete this.state.invoice

        const { message, keyboard } = this.interfaces.invoiceInfo(invoice)
        return this.bot.editMessageText(message, {chat_id: account.group, message_id: MessageId, ...keyboard })
    }

    async createCheck(account, MessageId) {

        const [ check ] = await Promise.all([
            this.database.checks.create({
                group: account.group,
                type: this.state.check.type,
                activations: this.state.check.qty,
                amount: this.state.check.amount,
                token: this.state.check.token,
            }),

            account.balance.update({[this.state.check.token]: this.utils.updateBalance(account.balance[this.state.check.token], 'addToFreeze', this.state.check.amount * this.state.check.qty)}),
        ])

        delete this.state.check

        const { message, keyboard } = this.interfaces.checkInfo(check)
        return this.bot.editMessageText(message, {chat_id: account.group, message_id: MessageId, ...keyboard })
    }


    async registration(data, account) {
        if (data.params.success) 
            await this.bot.sendMessage(account.referer, `Пользователь ${account.referer} зарегестрировался по вашей реферальной ссылке`)
        
        const { message, keyboard } = this.interfaces.menu()
        return this.bot.sendMessage(account.group, message, { ...keyboard })
    }



    async activateCheck(data, account) {    
        const check = await this.database.checks.findOne({where: {name: `CH_${data.params.data}`}})
        
        if (!check || check.status != 'active')
            return this.bot.sendMessage(account.group, `Чек не найден, удалён или не был создан`, {reply_markup: {inline_keyboard: [[{text: 'Меню', callback_data: 'menu'}]]}})
    
        if (check.group == account.group)
            return this.bot.sendMessage(account.group, `Вы не можете активировать собственный чек`, {reply_markup: {inline_keyboard: [[{text: 'Меню', callback_data: 'menu'}]]}})

        if (check.activated.includes(account.group))
            return this.bot.sendMessage(account.group, `Вы уже активировали этот чек`, {reply_markup: {inline_keyboard: [[{text: 'Меню', callback_data: 'menu'}]]}})

        if (check.type == 'single') {
            if (check.recipient) {

                if (typeof check.recipient == 'string') {
                    if (data.message?.from?.username != check.recipient.replace('@', ''))
                        return this.bot.sendMessage(account.group, `Этот чек предназначен для другого пользователя`, {reply_markup: {inline_keyboard: [[{text: 'Меню', callback_data: 'menu'}]]}})
                }

                if (typeof check.recipient == 'object') {
                    if (data.message?.from.id != check.recipient.id)
                        return this.bot.sendMessage(account.group, `Этот чек предназначен для другого пользователя`, {reply_markup: {inline_keyboard: [[{text: 'Меню', callback_data: 'menu'}]]}})
                }
            }
        }

        if (check.password) {
            this.state.checkActivate = {
                id: check.id,
                message: data.message.message_id,
                state: 'check_password',
                password: check.password
            }

            const { message, keyboard } = this.interfaces.activateCheckPassword()
            return this.bot.sendMessage(account.group, message, { ...keyboard })
        }

        await this.checkActivateConfirm(check.id, account, data)
    }

    async checkActivateConfirm(id, account, data) {
        delete this.state.checkActivate

        const check             = await this.database.checks.findOne({where: { id }})
        const checkOwnerBalance = await this.database.balances.findOne({where: {group: check.group}})
        
        if (check.activations <= check.activated.length)
            return this.bot.sendMessage(account.group, `Чек уже был активирован`, {reply_markup: {inline_keyboard: [[{text: 'Меню', callback_data: 'menu'}]]}})

        console.log(check.amount)
        console.log('jdsbnfbnsjedbnfujewbnf')

        console.log(checkOwnerBalance)
        console.log(account.balance)

        console.log(check)
        await Promise.all([
            checkOwnerBalance.update({[check.token]: this.utils.updateBalance(checkOwnerBalance[check.token], `removeFromFreezeAndBalance`, check.amount) }),
            account.balance.update({[check.token]: this.utils.updateBalance(account.balance[check.token], `addToBalance`, check.amount) }),
            check.update({activated: [...check.activated, account.group]}),
        ])

        await Promise.all([
            this.bot.sendMessage(check.group, `${this.utils.formatUserString(data.message.from)} активировал ваш чек и получил ${check.amount} ${check.token.toUpperCase()}`),
            this.bot.sendMessage(account.group, `Вы активировали чек и получили ${check.amount} ${check.token.toUpperCase()}`,  {reply_markup: {inline_keyboard: [[{text: 'Открыть кошелек', callback_data: 'wallet'}]]}})
        ])

        if (check.activations <= check.activated.length) {
            for (const checkMessageId of check.inline_messages) {
                try {
                    await this.bot.editMessageText(`Чек на ${check.amount} ${check.token.toUpperCase()} ${check.recipient ? ` для ${check.recipient}` : ''}${check.comment ? `\n\nКоммент: ${check.comment}`:''}`, {
                        inline_message_id: checkMessageId,
                        reply_markup: {inline_keyboard: [[{text: '✔️ Получено', url: this.interfaces.link}]]}
                    })
                } catch (e) {}
            }

            await check.destroy()
        }
    }

    async deactivated(account) {
        const { message, keyboard } = this.interfaces.deactivated()
        return this.bot.sendMessage(account.group, message, { ...keyboard })
    }

    async query(data, account) {
        
        const parseQuery = this.utils.parseQuery(data.message.query)
        
        this.state.query = this.state.query || {};

        if (parseQuery.amount) {
            const balances = this.utils.checkToQueryCheck(account.balance)

            balances.forEach(balance => {
                const token = balance.token.toUpperCase();

                if (balance.amount >= parseQuery.amount) {

                    this.state.query[`check_${token.toLowerCase()}`] = {
                        type: 'article',
                        id: `CheckCreate_${token.toLowerCase()}`,
                        title: `Отправить ${parseQuery.amount} ${token.toUpperCase()}`,
                        description: `Ваш баланс ${balance.amount} ${token.toUpperCase()}`,
                        input_message_content: {
                            message_text: `Создание чека...`
                        },
                        reply_markup: {
                            inline_keyboard: [[{ text: '...', callback_data: '...' }]]
                        }
                    }
                } else {
                    delete this.state.query[`check_${token}`]
                }
            })
        }

        const parseInvoice = this.utils.parseQueryInvoice(data.message.query)

        if (parseInvoice.amount) {

            const tokens = ['s', 'hitcoin']

            if (!parseInvoice.token) {
                tokens.forEach(token => {
                    this.state.query[`invoice_${token}`] = {
                        type: 'article',
                        id: `InvoiceCreate_${token}`,
                        title: `Создать счет на ${parseInvoice.amount} ${token.toUpperCase()}`,
                        input_message_content: {
                            message_text: `Создание счета...`
                        },
                        reply_markup: {
                            inline_keyboard: [[{ text: '...', callback_data: '...' }]]
                        }
                    }
                })
            } else {
                if (tokens.includes(parseInvoice.token)) {
                    this.state.query[`invoice_${parseInvoice.token}`] = {
                        type: 'article',
                        id: `InvoiceCreate_${parseInvoice.token}`,
                        title: `Создать счет на ${parseInvoice.amount} ${parseInvoice.token.toUpperCase()}`,
                        input_message_content: {
                            message_text: `Создание счета...`
                        },
                        reply_markup: {
                            inline_keyboard: [[{ text: '...', callback_data: '...' }]]
                        }
                    }
                }
            }
        }


        if (data.message.query && data.message.query.startsWith('CH_')) {
            const dynamicPart = data.message.query.substring(3)

            if (dynamicPart.length == 12) {
                const check = await this.database.checks.findOne({where: {name: `CH_${dynamicPart}`}})

                if (check || check.group == data.message.from.id) {
                    const token = check.token.toUpperCase();

                    this.state.query['check'] = {
                        type: 'article',
                        id: `CheckShare`,
                        title: 'Отправить чек',
                        description: `${check.amount} ${token}`,
                        input_message_content: {
                            message_text: `Чек на ${check.amount} ${token}`
                        },
                        reply_markup: {
                            inline_keyboard: [[{ text: 'Получить', url: this.interfaces.link + check.name }]]
                        }
                    }
                } else {
                    delete this.state.query['check']
                }
            }
        }
        
        if (data.message.query && data.message.query.startsWith('INV_')) {
            const dynamicPart = data.message.query.substring(4)

            if (dynamicPart.length == 12) {
                const invoice = await this.database.invoices.findOne({where: {name: `INV_${dynamicPart}`}})

                if (invoice || invoice.group == data.message.from.id) {
                    const token = invoice.token.toUpperCase();

                    this.state.query['invoice'] = {
                        type: 'article',
                        id: `invoiceShare`,
                        title: invoice.type == 'multi' ? 'Мульти-счет' : 'Одноразовый счет',
                        description: `Сумма: ${invoice.amount ? `${invoice.amount} ${invoice.token.toUpperCase()} ($${this.utils.calculateUsdtPrice(invoice.amount, invoice.token)})` : 'Без ограничений'}${invoice.minimal && invoice.type == 'multi' ? `\nМинимальный платеж: ${invoice.minimal} ${invoice.token.toUpperCase()}` : ''}`,
                        input_message_content: {
                            message_text: `Счет на ${invoice.amount != null ? invoice.amount : '∞'} ${token}${invoice.minimal && invoice.type == 'multi' ? `\nМинимальный платеж: ${invoice.minimal} ${invoice.token.toUpperCase()}` : ''}`
                        },
                        reply_markup: {
                            inline_keyboard: [[{ text: 'Оплатить', url: this.interfaces.link + invoice.name }]]
                        }
                    }
                } else {
                    delete this.state.query['invoice']
                }
            }
        }

        await this.bot.answerInlineQuery(data.message.id, Object.values(this.state.query), { cache_time: 0 });

        delete this.state.query
    }

    async createQueryInvoice(data, account) {
        const parseQueryInvoice = this.utils.parseQueryInvoice(data.message.query)

        const invoice = await this.database.invoices.create({
            group: account.group,
            type: 'single',
            amount: parseQueryInvoice.amount,
            token: data.message.result_id.split('_')[1],
            inline_messages: [data.message.inline_message_id]
        })

        if (!invoice)
            return this.bot.editMessageText(`Произошла ошибка при создании счета`, {inline_message_id: data.message.inline_message_id})

        await this.bot.editMessageText(`Счет на ${parseQueryInvoice.amount} ${data.message.result_id.split('_')[1].toUpperCase()}`, {
            inline_message_id: data.message.inline_message_id,
            reply_markup: {inline_keyboard: [[{text: 'Оплатить', url: this.interfaces.link + invoice.name}]]}
        })
    }

    async createQueryCheck(data, account) {
        
        const parseQuery = this.utils.parseQuery(data.message.query)

        const check = await this.database.checks.create({
            group: account.group,
            type: 'single',
            activations: 1,
            amount: parseQuery.amount,
            token: data.message.result_id.split('_')[1],
            comment: parseQuery.comment,
            recipient: parseQuery.recipient,
            inline_messages: [data.message.inline_message_id]
        })

        if (!check)
            return this.bot.editMessageText(`Произошла ошибка при создании чека`, {inline_message_id: data.message.inline_message_id})

        await account.balance.update({[check.token]: this.utils.updateBalance(account.balance[check.token], 'addToFreeze', check.amount * check.activations)})

        await this.bot.editMessageText(`Чек на ${parseQuery.amount} ${data.message.result_id.split('_')[1].toUpperCase()} ${parseQuery.recipient ? ` для ${parseQuery.recipient}` : ''}${parseQuery.comment ? `\n\nКоммент: ${parseQuery.comment}`:''}`, {
            inline_message_id: data.message.inline_message_id,
            reply_markup: {inline_keyboard: [[{text: 'Получить', url: this.interfaces.link + check.name}]]}
        })
    }

    async shareQueryCheck(data, account) {
        const check = account.checks.find(check => check.name == data.message.query)
        await check.update({inline_messages: [...check.inline_messages, data.message.inline_message_id]})
    }

    async shareQueryInvoice(data, account) {
        const invoice = account.invoices.find(invoice => invoice.name == data.message.query)
        await invoice.update({inline_messages: [...invoice.inline_messages, data.message.inline_message_id]})
    }
}

module.exports = TELEGRAM