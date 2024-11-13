class KEYBOARDS {

    back(route) {
        const keyboard = [
            [{text: '◂ Назад', callback_data: route}],
        ]

        return {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
    }

    successWithdrawal(id) {
        const keyboard = [
            [{text: 'Просмотреть заявку на вывод', callback_data: `history_withdrawals_${id}`}],
            [{text: '◂ Назад', callback_data: `wallet`}],
        ]

        return {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
    }

    support() {
        const keyboard = [
            [{text: 'Поддержка', url: 'tg://resolve?domain=koncumone_dev'}]
        ]

        return {reply_markup: {resize_keyboard: true, inline_keyboard: keyboard}} 
    }
}

module.exports = new KEYBOARDS()