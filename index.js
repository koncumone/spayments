const TelegramApi    = require('node-telegram-bot-api'),
      bot            = new TelegramApi('7780536308:AAF0mGdhYfuwjsAHt173ZwjycT_HC9EOm-I', {polling: true})

const SESSIONS       = require('./modules/sessions'),
      DATABASE       = require('./db/index')

const SessionManager = new SESSIONS(DATABASE, bot)


const routes = {
    'r':   async (session, message, param) => await session.process({message, route: 'registration', params: {data: param, success: false}}),
    'CH':  async (session, message, param) => await session.process({message, route: 'check', params: {data: param, success: false}}),
    'INV': async (session, message, param) => await session.process({message, route: 'invoice', params: {data: param, success: false}}),
}

bot.on('message', async (message) => { 

    try {

        if (!message.text) {
            console.log('Сообщение не содержит текст.')
            return
        }

        if (message.chat.type != 'private') {
            console.log('Сообщение отправлено не в бот')
            return 
        }
        
        const session = SessionManager.getSessions(message.chat.id)
        
        const command = message.text.split(' ') 
        const route   = command[1]

        if (!message.text.startsWith('/start') || !route) {
            await session.process({message, route: 'message', params: null})
            return
        }

        const params = route.split('_')
        const action = params[0]

        if (action in routes) {
            await routes[action](session, message, params[1])
        } else {
            await session.process({message, route: 'message', params: null})
        }
                
    } catch (error) {
        console.log('error to handle message', error)
        return null
    }
})

bot.on('callback_query', async(message) => { 

    if (message?.inline_message_id) {
        console.log('Игнорирование инлайн сообщения.')
        return
    }

    try {
        const session = SessionManager.getSessions(message.message.chat.id)
        await session.process({message, route: 'callback', params: null})
    } catch (error) {
        console.log('error to handle callback', error)
        return null
    }
})


bot.on('chosen_inline_result', async (chosenResult) => {
    try {
        const session = SessionManager.getSessions(chosenResult.from.id)
        await session.process({message: chosenResult, route: `query${chosenResult.result_id.split('_')[0]}`, params: null})
    } catch (error) {
        console.log('error to handle callback', error)
        return null
    }
})

bot.on('inline_query', async(query) => {
    try {
        const session = SessionManager.getSessions(query.from.id)
        await session.process({message: query, route: 'query', params: {chat_type: query.chat_type}})
    } catch (error) {
        console.log('error to handle callback', error)
        return null
    }
})

