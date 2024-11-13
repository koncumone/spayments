const utils = require('./utils')

class INTERFACES {

    constructor(utils) {
        this.utils = utils

        this.minimals = {
            s: {deposite: '250M S', withdrawDisplay: '1B S', withdrawNumber: 1000000000, checkDisplay: '100000000 S', checkNumber: 100000000},
            hitcoin: {deposite: '1 HITCOIN', withdrawDisplay: '10 HITCOIN', withdrawNumber: 10, checkDisplay: '0.1 HITCOIN', checkNumber: 0.1},
        }

        this.withdrawals_states = {
            pending: '⏳',
            accept: '✔️',
            declined: '✖️',
        }

        this.link = `t.me/s_testpayments_bot?start=`
    }

    menu() {
        const message = `S`

        const keyboard = [
            [{text: 'Кошелек', callback_data: 'wallet'}],
            [{text: 'Чеки', callback_data: 'checks'}, {text: 'Счета', callback_data: 'invoices' }],
            [{text: 'Подписки', callback_data: 'subscriptions'}, {text: 'Розыгрыши', callback_data: 'raffles'}],
            [{text: 'S Pay', callback_data: 'spay' }, {text: 'Рефералы', callback_data: 'referals'}],
            [{text: 'Поддержка', url: 'tg://resolve?domain=koncumone_dev'}]
        ]

        return {
            message,
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        }
    }

    wallet(account) {

        const tokens = [
            { name: 'Token S', value: account.balance.s.available, freeze: account.balance.s.freeze, ticker: 'S' },
            { name: 'Hitcoin', value: account.balance.hitcoin.available, freeze: account.balance.hitcoin.freeze, ticker: 'HITCOIN' }
        ];

        const totalUsdt = tokens.reduce((sum, token) => sum + parseFloat(this.utils.calculateUsdtPrice(token.value, token.ticker)), 0)

        const message = `Кошелек\n\n` +
            tokens.map(token => {
                const availableInUsd = parseFloat(this.utils.calculateUsdtPrice(token.value, token.ticker));
                const freezeInUsd = parseFloat(this.utils.calculateUsdtPrice(token.freeze, token.ticker));
                const formattedValue = this.utils.formatNumber(token.value);
                return `${token.name}: ${formattedValue} ${token.ticker}${availableInUsd > 0 ? ` ($${availableInUsd})` : ''}${token.freeze > 0 ? `\n⠀└ freeze: ${this.utils.formatNumber(token.freeze)} ${token.ticker} ($${freezeInUsd})` : ``}`;
            }).join('\n\n') + `\n\n≈ ${totalUsdt} USDT`;      

        const keyboard = [
            [{text: 'Пополнить', callback_data: 'deposite'}, {text: 'Вывести', callback_data: 'withdraw'}],
            account.withdrawals.length ? [{text: 'Заявки на вывод', callback_data: 'withdrawalRequests'}] : [],
            [{text: 'Коммисии и лимиты', callback_data: 'taxesInfo'}],
            [{text: '◂ Назад', callback_data: 'menu'}]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        }
    }

    deactivated() {
        const message = `Ваш аккаунт был деактивирован. Обратитесь в поддержку для разьеснения причин`

        const keyboard = [
            [{text: 'Поддержка', url: 'tg://resolve?domain=koncumone_dev'}]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        }
    }

    taxesInfo() {
        const message = `in the realization process`

        const keyboard = [
            [{text: '◂ Назад', callback_data: 'menu'}]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        }
    }

    preDeposite(route) {
 
        const message = `Пополнение\n\nВыберите токен для пополнения:`

        const keyboard = [
            [{text: 'S', callback_data: `${route}_s`}],
            [{text: 'Hitcoin', callback_data: `${route}_hitcoin`}],
            [{text: '◂ Назад', callback_data: 'wallet'}]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        }

    }

    deposite(token, wallet) {

        const message = `Пополнение\n\nДля пополнения вашего баланса ${token.toUpperCase()}, отправьте монеты на адрес указаный ниже.\n\nСеть: Arbitum\nАдрес: ${wallet}\n\nМинимальная сумма: ${this.minimals[token].deposite}\n\nВнимание! Пополняйте только ${token.toUpperCase()} в сети Arbitrum. Если Вы отправите другие монеты либо используете другую сеть, Ваши монеты будут потеряны.`
        
        const keyboard = [
            [{text: '◂ Назад', callback_data: 'deposite'}]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        }
    }

    preWithdraw(route) {
        const message = `Вывод\n\nВыберите токен для вывода:`

        const keyboard = [
            [{text: 'S', callback_data: `${route}_s`}],
            [{text: 'Hitcoin', callback_data: `${route}_hitcoin`}],
            [{text: '◂ Назад', callback_data: 'wallet'}]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        }

    }

    withdraw(token) {
        const message = `Вывод\n\nТокен: ${token.toUpperCase()}\nМинимальная сумма: ${this.minimals[token].withdrawDisplay}\n\nВвведите сумму для вывода:`
       
        const keyboard = [
            [{text: '◂ Назад', callback_data: 'withdraw'}]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        }
    }

    confirmWithdraw(withdraw) {
       
        const message = `Вывод\n\nПроверьте и подтвердите данные для вывода

Токен: ${withdraw.token.toUpperCase()}
Cеть: Arbitrum
Количество: ${withdraw.amount} ${withdraw.token.toUpperCase()}
Адрес: ${withdraw.address}

Внимательно проверьте правильность всех данных. После подтвердженя вывода, средства вернуть уже не можно
`
        const keyboard = [
            [{text: 'Подтвердить', callback_data: 'confirmWithdraw'}],
            [{text: '◂ Назад', callback_data: `withdraw_${withdraw.token}`}]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 

    }

    withdrawalRequests(withdrawals) {

        const message = `Заявки на вывод\n\nЗдесь вы можете просматривать заявки на вывод и историю выводов`

        const keyboard = withdrawals.map(request => [
            {text: `Вывод #${request.id}: ${this.utils.formatNumber(request.amount)} ${request.token.toUpperCase()} - ${this.withdrawals_states[request.status]}`, callback_data: `history_withdrawals_${request.id}`}
        ])

        keyboard.push(
            [{ text: '◂ Назад', callback_data: 'wallet' }]
        );
        
        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    withdrawalInfo(withdrawal) {
        console.log(withdrawal)

        const message = `Заявка на вывод #${withdrawal.id}        

Статус: ${withdrawal.status}
Сумма: ${withdrawal.amount} ${withdrawal.token.toUpperCase()}
Дата создания: ${this.utils.formatDate(withdrawal.createdAt)} UTC 
Адрес: ${withdrawal.address}
`

        const keyboard = [
            [{text: '◂ Назад', callback_data: `withdrawalRequests`}]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 

    }

    preInvoice(invoices) {
        const message = `Здесь вы можете создать счёт для получения оплаты или сбора средств в криптовалюте.`

        const activeInvoices = invoices.filter(invoice => invoice.status == 'active')

        const keyboard = [
            [{text: 'Создать счет', callback_data: 'createInvoice'}],
            [{text: 'Создать из чата', switch_inline_query: ''}],
            activeInvoices.length != 0 ? [{text: 'Активные счета', callback_data: 'activeInvoices'}] : []
        ]

        keyboard.push(
            [{ text: '◂ Назад', callback_data: 'menu' }]
        );

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    typeInvoice() {
        const message = `Выберите тип счета`

        const keyboard = [
            [{text: 'Одноразовый', callback_data: 'createInvoice_type_single'}, {text: 'Мульти-счет', callback_data: 'createInvoice_type_multi'}]
        ]

        keyboard.push(
            [{ text: '◂ Назад', callback_data: 'invoices' }]
        );

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    tokenInvoice(route) {
        const message = `Выберите валюту счета.`

        const keyboard = [
            [{text: 'S', callback_data: `createInvoice_token_${route}_s`}, {text: 'Hitcoin', callback_data: `createInvoice_token_${route}_hitcoin`}]
        ]

        keyboard.push(
            [{ text: '◂ Назад', callback_data: 'createInvoice' }]
        );

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    amountInvoice(type, token) {

        const message = `Отправьте сумму счета в ${token.toUpperCase()}`

        const keyboard = [
            type == 'multi' ? [{text: 'Без ограничений', callback_data: `createInvoice_amount_${type}_${token}_infinity`}] : []
        ]

        keyboard.push(
            [{ text: '◂ Назад', callback_data: `createInvoice_type_${type}` }]
        )

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }


    activeInvoices(invoices) {

        const message = `Здесь вы можете управлять своими созданными cчетами.`

        const keyboard = invoices.map(invoice => {

            const invoiceType = invoice.type == 'multi' ? 'Мульти-счет' : 'Одноразовый'

            const checkAmount = invoice.amount != null ? this.utils.formatNumber(invoice.amount) : '∞'

            const amount = invoice.type == 'multi' ? `${checkAmount} ${invoice.token.toUpperCase()} · ${invoice.payed} / ${checkAmount}` : `${checkAmount} ${invoice.token.toUpperCase()}`

            return [{text: `${invoiceType} · ${amount}`, callback_data: `invoiceInfo_${invoice.id}`}]
        })

        keyboard.push(
            [{ text: '◂ Назад', callback_data: `invoices` }]
        );

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }


    preChecks(checks) {
        const message = `Здесь вы можете создать чек для мгновенной отправки криптовалюты любому пользователю.`

        const activeChecks = checks.filter(check => check.status == 'active')

        const keyboard = [
            [{text: 'Создать чек', callback_data: 'createCheck'}],
            [{text: 'Создать из чата', switch_inline_query: ''}],
            activeChecks.length != 0 ? [{text: 'Активные чеки', callback_data: 'activeChecks'}] : []
        ]

        keyboard.push(
            [{ text: '◂ Назад', callback_data: 'menu' }]
        );

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    tokenCheck() {
        const message = `Выберите криптовалюту для создания чека.`

        const keyboard = [
            [{text: 'S', callback_data: 'createCheck_amount_s'}, {text: 'Hitcoin', callback_data: 'createCheck_amount_hitcoin'}],
        ]

        keyboard.push(
            [{ text: '◂ Назад', callback_data: 'checks' }]
        );

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    amountCheck(token, balance) {

        const availableBalance = this.utils.checkAvailableBalance(balance[token].available, balance[token].freeze).toFixed(1)

        const message = `Пришлите сумму чека в токенах ${token.toUpperCase()}. Если вы хотите создать мультичек, введите кратную вашему балансу сумму одной активации.

Ваш баланс: ${availableBalance} ${token.toUpperCase()} ($${this.utils.calculateUsdtPrice(availableBalance, token)})`

        const keyboard = [
            [{text: `Мин · ${this.minimals[token].checkDisplay} · ($${this.utils.calculateUsdtPrice(this.minimals[token].checkNumber, token)})`, callback_data: `createCheck_qty_${token}_${this.minimals[token].checkNumber}`}], 
            [{text: `Макс · ${availableBalance} ${token.toUpperCase()} · ($${this.utils.calculateUsdtPrice(availableBalance, token)})`, callback_data: `createCheck_qty_${token}_${availableBalance}`}],
        ]

        keyboard.push(
            [{ text: '◂ Назад', callback_data: `createCheck` }]
        );

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    qtyCheck(token, balance, amount) {
        const availableBalance = this.utils.checkAvailableBalance(balance[token].available, balance[token].freeze)
        const maxActivations = (availableBalance / amount).toFixed(0)

        const message = `Пришлите количество активаций, чтобы создать мультичек (до ${maxActivations == 1 ? '1 активации' : `${maxActivations} активаций`}).`

        const keyboard = [
            [{text: `Пропустить`, callback_data: `createCheck_create_${token}_single_1`}], 
            maxActivations != 1 ? [{text: `Макс. кол-во ${maxActivations}`, callback_data: `createCheck_create_${token}_multi_${maxActivations}`}] : [],
        ]

        keyboard.push(
            [{ text: '◂ Назад', callback_data: `createCheck_amount_${token}` }]
        );

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    invoiceInfo(invoice) {
        const message = `Счет #${invoice.name}
        
Сумма: ${invoice.amount ? `${invoice.amount} ${invoice.token.toUpperCase()} ($${this.utils.calculateUsdtPrice(invoice.amount, invoice.token)})` : 'Без ограничений'}${invoice.minimal && invoice.type == 'multi' ? `\nМинимальный платеж: ${invoice.minimal} ${invoice.token.toUpperCase()}` : ''}      
${invoice.type == 'multi' ? `\nПлатежей: ${invoice.payers.length} - ${invoice.payed} ${invoice.token.toUpperCase()}\n` : ``}    
${invoice.description ? `Описание: ${invoice.description}\n` : ''}${invoice.hideMessage ? `\nСкрытое сообщение: ${invoice.hideMessage}\n` : ''}
Скопируйте ссылку, чтобы поделиться счетом: ${this.link + invoice.name}
`

        const keyboard = [
            [{text: 'Поделиться счетом', switch_inline_query: invoice.name}],
            !invoice.description ?  [{text: 'Добавить описание', callback_data: `invoiceManage_${invoice.id}_description_add`}] :  [{text: 'Убрать описание', callback_data: `invoiceManage_${invoice.id}_description_remove`}],
            !invoice.hideMessage ?  [{text: 'Добавить скрытое сообщение', callback_data: `invoiceManage_${invoice.id}_hide_add`}] :  [{text: 'Убрать скрытое сообщение', callback_data: `invoiceManage_${invoice.id}_hide_remove`}],
            !invoice.isComments ? [{text: 'Комментарии: выкл', callback_data: `invoiceManage_${invoice.id}_comments`}] :  [{text: 'Комментарии: вкл', callback_data: `invoiceManage_${invoice.id}_comments`}],
            [{text: 'Пересылать платежи - comming soon', callback_data: '...'}],
            [{text: 'Удалить счет', callback_data: `invoiceManage_${invoice.id}_delete_quote`}],
        ]

        keyboard.push(
            [{ text: '◂ Назад', callback_data: `activeInvoices` }]
        );

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    invoiceDescription(id) {
        const message = `Пришлите описание cчета (до 512 символов). Пользователи увидят это описание, когда вы поделитесь счетом.`

        const keyboard = [
            [{ text: '◂ Назад', callback_data: `invoiceInfo_${id}` }]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    invoiceHideMessage(id) {
        const message = `Пришлите скрытое сообщение для счета. Пользователи увидят его, после оплаты`

        const keyboard = [
            [{ text: '◂ Назад', callback_data: `invoiceInfo_${id}` }]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    checkInfo(check) {
        const message = `Чек
        
Сумма одного чека: ${check.amount} ${check.token.toUpperCase()} ($${this.utils.calculateUsdtPrice(check.amount, check.token)})
Количество активаций: ${check.activations}         
${check.type == 'single' && check.recipient ? `\nТолько ${this.utils.formatUserString(check.recipient)} ` : '\nЛюбой '}может активировать этот чек ${check.password ? 'после ввода пароля' : ''}

Активировано: ${check.activated.length}
Осталось: ${check.activations - check.activated.length}
${check.comment ? `\nКоммент: ${check.comment}\n`: ''}
Скопируйте ссылку, чтобы поделиться чеком: ${this.link + check.name}
`
        const keyboard = [
            [{text: 'Поделиться чеком', switch_inline_query: check.name}],
            !check.comment ? [{text: 'Добавить описание', callback_data: `checkManage_${check.id}_text_add`}] :  [{text: 'Убрать описание', callback_data: `checkManage_${check.id}_text_remove`}],
            [{text: 'Ограничения', callback_data: `checkManage_${check.id}_restricts`}],
            [{text: 'Удалить чек', callback_data: `checkManage_${check.id}_delete_quote`}],
        ]

        keyboard.push(
            [{ text: '◂ Назад', callback_data: `activeChecks` }]
        );

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    activeChecks(checks) {

        const message = `Здесь вы можете управлять своими созданными чеками.`

        const keyboard = checks.map(check => [
            {text: `${check.amount} ${check.token.toUpperCase()}${check.type == 'single' ? '' : ` · ${check.activated.length}/${check.activations}`} `, callback_data: `checkInfo_${check.id}`}
        ])

        keyboard.push(
            [{ text: '◂ Назад', callback_data: `checks` }]
        );

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    checkComment(id) {
        const message = `Пришлите описание чека (до 512 символов). Пользователи увидят это описание, когда вы поделитесь чеком.`

        const keyboard = [
            [{ text: '◂ Назад', callback_data: `checkInfo_${id}` }]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    invoiceDelete(id) {
        const message = `❌ Вы уверены, что хотите удалить этот счет?`

        const keyboard = [
            [{text: 'Да', callback_data: `invoiceManage_${id}_delete_yes`}, { text: 'Нет', callback_data: `invoiceInfo_${id}` }]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    checkDelete(id) {
        const message = `❌ Вы уверены, что хотите удалить этот чек?`

        const keyboard = [
            [{text: 'Да', callback_data: `checkManage_${id}_delete_yes`},{ text: 'Нет', callback_data: `checkInfo_${id}` }]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    checkRestricts(check) {
        const message = 'Здесь вы можете настроить ограничения, которые будут действовать при активации чека. Только пользователи, подходящие по этим ограничениям, смогут активировать чек.'
    
        const keyboard = [
            !check.password ? [{text: 'Добавить пароль', callback_data: `checkRestricts_${check.id}_password_add`}] : [{text: 'Убрать пароль', callback_data: `checkRestricts_${check.id}_password_remove`}],
            [],
            !check.isPremium ? [{text: 'Только для Telegram Premium: Нет', callback_data: `checkRestricts_${check.id}_premium`}] :  [{text: 'Только для Telegram Premium: Да', callback_data: `checkRestricts_${check.id}_premium`}],
        ]

        if (check.type == 'single') {
            keyboard[1].push(
                !check.recipient ? {text: 'Закрепить за пользователем', callback_data: `checkRestricts_${check.id}_user_pin`} :  {text: 'Открепить от пользователя', callback_data: `checkRestricts_${check.id}_user_unpin`},
            )
        }

        keyboard.push(
            [{ text: '◂ Назад', callback_data: `checkInfo_${check.id}` }]
        );

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    checkUser(id) {
        const message = `Пришлите @⁠username или перешлите сообщение пользователя, за которым вы хотите закрепить чек.`

        const keyboard = [
            [{ text: '◂ Назад', callback_data: `checkManage_${id}_restricts` }]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    checkPassword(id) {
        const message = `Добавьте пароль к чеку (до 512 символов). Пользователи смогут активировать чек только после ввода пароля.`

        const keyboard = [
            [{ text: '◂ Назад', callback_data: `checkManage_${id}_restricts` }]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    activateCheckPassword() {
        const message = `Чтобы активировать данный чек, нужно ввести пароль.`

        const keyboard = [
            [{ text: 'Меню', callback_data: `menu` }]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    userInvoiceAmount(invoiceData, balance) {
        const availableBalance = this.utils.checkAvailableBalance(balance.available, balance.freeze);

        const message = `Пришлите сумму ${invoiceData.token.toUpperCase()} для оплаты счета        
${invoiceData.amount ? `\nМаксимум: ${invoiceData.amount - invoiceData.payed} ${invoiceData.token.toUpperCase()}` : `\nМаксимум: Нету лимита`}${invoiceData.minimal ? `\nМинимум: ${invoiceData.minimal} ${invoiceData.token.toUpperCase()}` : ''}\n
Ваш баланс: ${availableBalance ? availableBalance : '0'} ${invoiceData.token.toUpperCase()}
`

        const keyboard = [
            [{ text: '◂ Назад', callback_data: `menu` }]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 
    }

    prePayInvoice(invoice, balance, invoiceData) {
        console.log(invoice)
        console.log(invoiceData)

        const availableBalance = this.utils.checkAvailableBalance(balance.available, balance.freeze);

        let message =  `Подтвердите оплату счета\n\n`,
            keyboard = [ 
                [],
                [],
                invoice.type == 'multi' ? [{ text: '◂ Изменить сумму', callback_data: `userInvoiceManage_${invoice.id}_amount_change` }] : [{ text: '◂ Назад', callback_data: `menu` }]
            ]

        if (invoice.type == 'multi') {
            message += `Отправляете ${invoiceData.userAmount} ${invoice.token}\n${invoiceData?.comment ? `\nКоментарий к платежу: ${invoiceData?.comment}\n` : ''}\nВы уверены, что хотите оплатить этот счёт?`
            keyboard[0].push({text: 'Оплатить', callback_data: `payInvoice_${invoice.id}_${invoiceData.userAmount}`})
            
        }

        if (invoice.type == 'single') {
            message += `Отправляете ${invoice.amount} ${invoice.token.toUpperCase()}\n${invoiceData?.comment ? `\nКоментарий к платежу: ${invoiceData?.comment}\n` : ''}\nВы уверены, что хотите оплатить этот счёт?`
            keyboard[0].push(
                availableBalance >= invoice.amount ? {text: 'Оплатить', callback_data: `payInvoice_${invoice.id}_${invoice.amount}`} : {text: 'Пополнить баланс', callback_data: `deposit_${invoice.token}`}
            ) 
        }

        if (invoice.isComments) {
            keyboard[1].push(
                invoiceData?.comment ? {text: 'Удалить комментарий', callback_data: `userInvoiceManage_${invoice.id}_comment_remove`} : {text: 'Добавить комментарий', callback_data: `userInvoiceManage_${invoice.id}_comment_add`}
            )
        }

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 

    }

    userInvoiceComment(id) {
        const message = `Пришлите комментарий к платежу, который будет виден в уведомлении об оплате`

        const keyboard = [
            [{text: '◂ Назад', callback_data: `userInvoiceManage_${id}_show`}]
        ]

        return { 
            message, 
            keyboard: {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
        } 

    }

}

module.exports = new INTERFACES(utils)