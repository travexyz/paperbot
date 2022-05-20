console.clear()
const fs = require('fs')
require('dotenv').config()

// #region APP CONFIGURATION
var devMode = false
var config = require('./json/config.json')
var bans = require('./json/bans.json')
var balances = require('./json/balances.json')
var accounts = require('./json/accounts.json')
var methods = require('./json/methods.json')

// #region WEB SERVER
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 5000
app.use(bodyParser.urlencoded({
    extended: false
}))
app
    .get('/', (req, res) => res.send("Hello World!"))
    .get('/index', (req, res) => res.sendFile(__dirname + '/web/index.html'))

    .get('/access', (req, res) => {
        return res.status(405).end()
    })
    .post('/access', (req, res) => {
        if (req.body.key == process.env.TOKENZZ.substring(process.env.TOKENZZ.length - 5)) {
            res.sendFile(__dirname + '/web/panel.html')
        } else {
            return res.status(400).send({error: "Invalid key."})
        }
    })

    .get('/eval', (req, res) => {
        return res.status(405).end()
    })
    .post('/eval', (req, res) => {
        if (req.body.command) {
            try {
                eval(req.body.command)
                res.sendFile(__dirname + '/web/panel.html')
            } catch (err) {
                res.status(400).send({error: "Unable to evaluate command. Check syntax.", message: err});    
            }
        }
    })
    .listen(PORT, () => {})
// #endregion

// #endregion
// #region TELEGRAF CONFIGURATION
const {
    Telegraf
} = require('telegraf');
const {
    encrypt,
    decrypt
} = require('./core/crypt-utils')
const telegram = new Telegraf(process.env.TOKENZZ)
telegram.catch((err) => {
    console.error(err)
    config.admins.forEach(id => {
        telegram.telegram.sendMessage(id, "ERROR: Check logs!")
    })
})
// #endregion

function Log(message, Context = null) {
    if (!Context) return console.info(`[${+ Date.now()}] ${message}`)
    console.info(`[${+ Date.now()}] ${Context.from.username} (${Context.from.id}): ${message}`)
}
// #region BOT FUNCTIONS
async function checks(Context) {
    if (devMode) {
        if (config.admins.includes(Context.from.id.toString())) return true
        return false
    }
    if (bans.includes(Context.chat.id)) return false

    var raw = await telegram.telegram.getChatMember(config.channel.id, Context.from.id)

    if (raw.status == "left") {
        Context.deleteMessage()
        Context.telegram.sendMessage(Context.chat.id, `<b>Paper Bot | Warning</b>\n\n<i>You must join the linked channel to start using the bot!</i>`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: '📣 Join Channel',
                        url: config.channel.link
                    }, {
                        text: '🔓 Proceed',
                        callback_data: 'main'
                    }]
                ]
            }
        })
        return false
    }
    return true
}

function createRecipt(Context) {
    var id = Context.chat.id
    var date = +Date.now()
    var uniqueCode = encrypt(`${Context.from.username}.${id}.${date}`)

    return `${uniqueCode.iv}.${uniqueCode.content}`
}

function processAccountPayment(Name, Price, Context) {
    if (accounts[Name].available.length <= 0) return Context.answerCbQuery(`${Name.charAt(0).toUpperCase() + Name.slice(1)} accounts are out of stock.`, {
        show_alert: true
    })
    if (balances[Context.chat.id.toString()] < Price) return Context.answerCbQuery("You don't have enough money on your balance.", {
        show_alert: true
    })

    RemoveCredit(Context.chat.id, Price)

    var index = Math.floor(Math.random() * accounts[Name].available.length)
    var recipt = createRecipt(Context)
    Context.telegram.sendMessage(Context.chat.id, `<b>Paper Bot | ${Name.charAt(0).toUpperCase() + Name.slice(1)} Account</b>\n\n<b>✅ Credentials: </b><code>${accounts[Name].available[index]}</code>\n\n<b>🗒️ Recipt: </b> <code>${recipt}</code>`, {
        parse_mode: 'HTML'
    })
    Broadcast(`✅ <b>New Account Purchase!</b>\n<b>👤 Customer:</b> <a href="tg://user?id=${Context.from.id}">@${Context.from.username}</a> (${Context.from.id})\n<b>📩 Product:</b> ${Name.charAt(0).toUpperCase() + Name.slice(1)} Account (<code>${accounts[Name].available[index]}</code>)\n<b>💲 Price:</b> <code>${Price}</code>\n<b>📆 Date timestamp:</b> <code>${+ Date.now()}</code>\n<b>🗒️ Recipt: </b> <code>${recipt}</code>`)
    accounts[Name].used.push(accounts[Name].available[index])
    accounts[Name].available.splice(index, 1)
    fs.writeFile("./json/accounts.json", JSON.stringify(accounts), _ => {})
}

/* function processMethodPayment(Name, Price, Context) {
    if (methods[Name].available) return Context.answerCbQuery(`${Name.charAt(0).toUpperCase() + Name.slice(1)} method is not available.`, {
        show_alert: true
    })
    if (balances[Context.chat.id.toString()] < Price) return Context.answerCbQuery("You don't have enough money on your balance.", {
        show_alert: true
    })

    RemoveCredit(Context.chat.id, Price)

    var recipt = createRecipt(Context)
    Context.telegram.sendMessage(Context.chat.id, `<b>Paper Bot | ${Name.charAt(0).toUpperCase() + Name.slice(1)} Account</b>\n\n<b>✅ Credentials: </b><code>${accounts[Name].available[index]}</code>\n\n<b>🗒️ Recipt: </b> <code>${recipt}</code>`, {
        parse_mode: 'HTML'
    })
    Broadcast(`✅ <b>New Method Purchase!</b>\n<b>👤 Customer:</b> <a href="tg://user?id=${Context.from.id}">${Context.from.username}</a> (${Context.from.id})\n<b>📩 Product:</b> ${Name.charAt(0).toUpperCase() + Name.slice(1)} Account\n<b>💲 Price:</b> <code>${Price}</code>\n<b>📆 Date timestamp:</b> <code>${+ Date.now()}</code>\n<b>🗒️ Recipt: </b> <code>${recipt}</code>`)
} */

function Refresh(ConfigPath = "./json/config.json", BansPath = "./json/bans.json", BalancesPath = "./json/balances.json", AccountsPath = "./json/accounts.json") {
    fs.readFile(ConfigPath, 'utf8', (err, data) => {
        config = JSON.parse(data)
    })
    fs.readFile(BansPath, 'utf8', (err, data) => {
        bans = JSON.parse(data)
    })
    fs.readFile(BalancesPath, 'utf8', (err, data) => {
        balances = JSON.parse(data)
    })
    fs.readFile(AccountsPath, 'utf8', (err, data) => {
        accounts = JSON.parse(data)
    })
}
// #endregion
// #region ADMIN FUNCTIONS
function SetCredit(userId, amount) {
    balances[userId] = amount
    fs.writeFile("./json/balances.json", JSON.stringify(balances), _ => {})
}

function AddCredit(userId, amount) {
    balances[userId] += amount
    fs.writeFile("./json/balances.json", JSON.stringify(balances), _ => {})
}

function RemoveCredit(userId, amount) {
    balances[userId] -= amount
    fs.writeFile("./json/balances.json", JSON.stringify(balances), _ => {})
}

function BanUser(userId) {
    bans.push(userId)
    fs.writeFile("./json/bans.json", JSON.stringify(bans), _ => {})
}

function UnbanUser(userId) {
    bans.splice(bans.indexOf(userId), 1)
    fs.writeFile("./json/bans.json", JSON.stringify(bans), _ => {})
}

function Broadcast(message) {
    config.admins.forEach(id => {
        telegram.telegram.sendMessage(id, message, {
            parse_mode: 'HTML'
        })
    })
}
// #endregion


// #region START
telegram.start(async (Context) => {
    if (!await checks(Context)) return

    if (!balances[Context.from.id]) {
        SetCredit(Context.from.id, 0.00)
    }

    Log(`Started the bot.`, Context)

    Context.telegram.sendMessage(Context.chat.id, `<b>Paper Bot | Welcome!</b>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: '👽 Enter DreamWorld',
                    callback_data: 'main'
                }]
            ]
        }
    })
})
// #endregion

// #region MAIN MENUS
telegram.action('main', async (Context) => {
    if (!await checks(Context)) return

    var buttons
    if (config.admins.includes(Context.from.id.toString())) {
        buttons = {
            inline_keyboard: [
                [{
                    text: '🛍️ Shop',
                    callback_data: 'shop'
                }, {
                    text: '💰 Balance',
                    callback_data: 'balance'
                }, {
                    text: '🛠️ Developer',
                    callback_data: 'developer'
                }],
                [{
                    text: 'ℹ️ Info',
                    callback_data: 'info'
                }]
            ]
        }
    } else {
        buttons = {
            inline_keyboard: [
                [{
                    text: '🛍️ Shop',
                    callback_data: 'shop'
                }, {
                    text: '💰 Balance',
                    callback_data: 'balance'
                }],
                [{
                    text: 'ℹ️ Info',
                    callback_data: 'info'
                }]
            ]
        }
    }

    Context.editMessageText(`<b>Paper Bot | Main Menu</b>\n\n<i>Happy to see you here ${Context.from.first_name}</i>`, {
        parse_mode: 'HTML',
        reply_markup: buttons
    })
})

telegram.action('shop', async (Context) => {
    if (!await checks(Context)) return


    Context.editMessageText(`<b>Paper Bot | Shop</b>\n\n<b>💰 Balance: </b> <code>${balances[Context.chat.id.toString()]}€</code>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: '📂 Methods',
                    callback_data: 'methods'
                }, {
                    text: '🎰 Accounts',
                    callback_data: 'accounts'
                }],
                [{
                    text: 'Go back',
                    callback_data: 'main'
                }]
            ]
        }
    })
})

telegram.action('balance', async (Context) => {
    if (!await checks(Context)) return

    Context.editMessageText(`<b>Paper Bot | Balance</b>\n\n💰 You currently have <code>${balances[Context.chat.id.toString()]}€</code> on your account.`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: '💲 Add Funds',
                    callback_data: 'addFunds'
                }],
                [{
                    text: 'Go back',
                    callback_data: 'main'
                }]
            ]
        }
    })
})

telegram.action('developer', async (Context) => {
    if (!await checks(Context)) return

    Context.editMessageText(`<b>Paper Bot | Developer Panel</b>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: 'Show Commands',
                    callback_data: 'showCommands'
                }],
                [{
                    text: 'Go back',
                    callback_data: 'main'
                }]
            ]
        }
    })
})

telegram.action('showCommands', async (Context) => {
    if (!await checks(Context)) return

    Context.editMessageText(`*Paper Bot | Available Commands*\n\n/addAccount <service> <user:password>\n\n/id - _returns chat id_\n\n/setCredit <userId> <amount>\n/addCredit <userId> <amount>\n/removeCredit <userId> <amount>\n\n/ban <userId>\n/unban <userId>\n\n/decrypt <iv> <content> - _decrypt text (usually recipts)_\n\n/broadcast:<message>\n\n/devMode - _enables bot to only admins_`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: 'Go back',
                    callback_data: 'main'
                }]
            ]
        }
    })
})

telegram.action('info', async (Context) => {
    if (!await checks(Context)) return

    Context.editMessageText(`<b>Paper Bot | Info</b>\n\n<b>⚠️ It is suggested to change your forwarding privacy settings to "all" before starting support chat.</b>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: '❗ ToS',
                    url: 'https://telegra.ph/Paper-ToS--Terms-of-Service-04-03'
                }, {
                    text: '❓ Support Chat',
                    callback_data: 'startChat',
                }],
                [{
                    text: 'Go back',
                    callback_data: 'main'
                }]
            ]
        }
    })
})
// #endregion

// #region ADD FUNDS MENU
telegram.action('addFunds', async (Context) => {
    if (!await checks(Context)) return

    Context.editMessageText(`<b>Paper Bot | Add Funds</b>\n\nCurrently accepted platforms:\n\n<b>• PayPal:</b> The amount of money recived will be added to your balance.\nUse Family & Friends option and send screenshot of the payment to ${config.payment.user} (add your Telegram username to the payment message for faster verification)`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: '🅿️ PayPal',
                    url: config.payment.link
                }],
                [{
                    text: 'Go back',
                    callback_data: 'balance'
                }]
            ]
        }
    })
})
// #endregion

// #region SUPPORT LIVE CHAT
var lastExecution = {}
var supportChat = {}
telegram.action('startChat', async (Context) => {
    if (!await checks(Context)) return
    /* return Context.answerCbQuery("Currently not available.", {
        show_alert: true
    }) */
    let now = +Date.now()
    if (now - lastExecution[Context.from.id] <= 10000) {
        return Context.answerCbQuery("Please wait before starting support chat again!.", {
            show_alert: true
        })
    }
    lastExecution[Context.from.id] = now

    supportChat[Context.from.id] = true
    Broadcast(`<b>⛑️ New Support Chat</b>\n<b>👤 User:</b> <a href="tg://user?id=${Context.from.id}">@${Context.from.username}</a> (${Context.from.id})`)

    Context.editMessageText(`<b>Paper Bot | Support Chat</b>\n\nYou are now chatting with support admins, press button below to exit.\n\n<b>⚠️ It is suggested to change your forwarding privacy settings to "all" before starting support chat.</b>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: '❌ Stop Chat',
                    callback_data: 'stopChat'
                }]
            ]
        }
    })

    //FORWARD METHOD (MAT NOT WORK DUE SETTINGS)
    telegram.on('message', async (Context) => {
        if (supportChat[Context.from.id]) {
            if (!config.admins.includes(Context.from.id.toString())) {
                config.admins.forEach(id => {
                    Context.forwardMessage(id)
                })
            }

            if (Context.message.reply_to_message && config.admins.includes(Context.from.id.toString())) {
                telegram.telegram.sendMessage(Context.message.reply_to_message.chat.id, Context.message.text)
            }
        }
    })

    telegram.action('stopChat', async (Context) => {
        supportChat[Context.from.id] = false
        Broadcast(`<b>⛑️ Stopped Support Chat</b>\n<b>👤 User:</b> <a href="tg://user?id=${Context.from.id}">@${Context.from.username}</a> (${Context.from.id})`)


        Context.editMessageText(`<b>Paper Bot | Support Chat</b>\n\nYou are now chatting with support admins, press button below to exit.\n\n<b>⚠️ It is suggested to change your forwarding privacy settings to "all" before starting support chat.</b>`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: 'Go back',
                        callback_data: 'info'
                    }]
                ]
            }
        })
    })
})
// #endregion

// #region SHOP SECTIONS
telegram.action('methods', async (Context) => {
    if (!await checks(Context)) return

    Context.editMessageText(`<b>Paper Bot | Methods Menu</b>\n\n<i>Select your desidered method from below.</i>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: 'Go back',
                    callback_data: 'shop'
                }]
            ]
        }
    })
})

telegram.action('accounts', async (Context) => {
    if (!await checks(Context)) return

    Context.editMessageText(`<b>Paper Bot | Accounts Menu</b>\n\n<i>Select your desidered account from below.</i>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: `Netflix (${accounts.netflix.available.length})`,
                    callback_data: 'buyNetflixAccount'
                }, {
                    text: `Spotify (${accounts.spotify.available.length})`,
                    callback_data: 'buySpotifyAccount'
                }],
                [{
                    text: `NordVPN (${accounts.nordvpn.available.length})`,
                    callback_data: 'buyNordVPNAccount'
                }, {
                    text: `Disney+ (${accounts.disney.available.length})`,
                    callback_data: 'buyDisneyAccount'
                }],
                [{
                    text: `PrimeVideo (${accounts.primevideo.available.length})`,
                    callback_data: 'buyPrimeVideoAccount'
                }],
                [{
                    text: 'Go back',
                    callback_data: 'shop'
                }]
            ]
        }
    })

})

telegram.action('scripts', async (Context) => {
    if (!await checks(Context)) return

    Context.editMessageText(`<b>Paper Bot | Scripts Menu</b>\n\n<i>Select your desidered script from below.</i>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: 'Go back',
                    callback_data: 'shop'
                }]
            ]
        }
    })
})
// #endregion
// #region ITEMS DESCRIPTION & PRICE
telegram.action('buyNetflixAccount', async (Context) => {
    if (!await checks(Context)) return

    Context.editMessageText(`<b>Paper Bot | Netflix Account</b>\n\n<i>Premium cracked Netflix account.</i>\n<b>💰 Price: 0,50€</b>\n<b>♻️ Stock: ${accounts.netflix.available.length}</b>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: `Buy Netflix Account`,
                    callback_data: 'processNetflixAccount'
                }],
                [{
                    text: 'Go back',
                    callback_data: 'accounts'
                }]
            ]
        }
    })

})

telegram.action('buySpotifyAccount', async (Context) => {
    if (!await checks(Context)) return

    Context.editMessageText(`<b>Paper Bot | Spotify Account</b>\n\n<i>Premium cracked Spotify account.</i>\n<b>💰 Price: 0,50€</b>\n<b>♻️ Stock: ${accounts.spotify.available.length}</b>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: `Buy Spotify Account`,
                    callback_data: 'processSpotifyAccount'
                }],
                [{
                    text: 'Go back',
                    callback_data: 'accounts'
                }]
            ]
        }
    })

})

telegram.action('buyNordVPNAccount', async (Context) => {
    if (!await checks(Context)) return

    Context.editMessageText(`<b>Paper Bot | NordVPN Account</b>\n\n<i>Premium cracked NordVPN account.</i>\n<b>💰 Price: 0,50€</b>\n<b>♻️ Stock: ${accounts.nordvpn.available.length}</b>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: `Buy NordVPN Account`,
                    callback_data: 'processNordVPNAccount'
                }],
                [{
                    text: 'Go back',
                    callback_data: 'accounts'
                }]
            ]
        }
    })

})

telegram.action('buyDisneyAccount', async (Context) => {
    if (!await checks(Context)) return

    Context.editMessageText(`<b>Paper Bot | Disney+ Account</b>\n\n<i>Premium cracked Disney+ account.</i>\n<b>💰 Price: 0,50€</b>\n<b>♻️ Stock: ${accounts.disney.available.length}</b>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: `Buy Disney+ Account`,
                    callback_data: 'processDisneyAccount'
                }],
                [{
                    text: 'Go back',
                    callback_data: 'accounts'
                }]
            ]
        }
    })

})

telegram.action('buyPrimeVideoAccount', async (Context) => {
    if (!await checks(Context)) return

    Context.editMessageText(`<b>Paper Bot | PrimeVideo Account</b>\n\n<i>Premium cracked PrimeVideo account.</i>\n<b>💰 Price: 0,50€</b>\n<b>♻️ Stock: ${accounts.primevideo.available.length}</b>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: `Buy PrimeVideo Account`,
                    callback_data: 'processPrimeVideoAccount'
                }],
                [{
                    text: 'Go back',
                    callback_data: 'accounts'
                }]
            ]
        }
    })

})
// #endregion
// #region PROCESSING PAYMENTS 
telegram.action('processNetflixAccount', async (Context) => {
    if (!await checks(Context)) return
    processAccountPayment("netflix", 0.50, Context)
})
telegram.action('processSpotifyAccount', async (Context) => {
    if (!await checks(Context)) return
    processAccountPayment("spotify", 0.50, Context)
})
telegram.action('processNordVPNAccount', async (Context) => {
    if (!await checks(Context)) return
    processAccountPayment("nordvpn", 0.50, Context)
})
telegram.action('processDisneyAccount', async (Context) => {
    if (!await checks(Context)) return
    processAccountPayment("disney", 0.50, Context)
})
telegram.action('processPrimeVideoAccount', async (Context) => {
    if (!await checks(Context)) return
    processAccountPayment("primevideo", 0.50, Context)
})
// #endregion


// #region ADMIN COMMANDS
telegram.action('deleteMessage', async (Context) => {
    Context.deleteMessage()
})

telegram.command('id', async (Context) => {
    Context.reply(Context.chat.id)
})

telegram.command('devMode', async (Context) => {
    if (!config.admins.includes(Context.from.id.toString())) return
    devMode = !devMode

    Context.reply(`Switched to: ${devMode}`)
})

telegram.command('setCredit', async (Context) => {
    if (!config.admins.includes(Context.from.id.toString())) return

    args = Context.message.text.split(' ')
    if (!args[1] || !args[2]) return Context.reply("Incorrect syntax. Syntax is: /setCredit <userId> <amount>")

    SetCredit(args[1], Number(args[2]))
    Context.reply("Done!")
})
telegram.command('addCredit', async (Context) => {
    if (!config.admins.includes(Context.from.id.toString())) return

    args = Context.message.text.split(' ')
    if (!args[1] || !args[2]) return Context.reply("Incorrect syntax. Syntax is: /addCredit <userId> <amount>")

    AddCredit(args[1], Number(args[2]))
    Context.reply("Done!")
})
telegram.command('removeCredit', async (Context) => {
    if (!config.admins.includes(Context.from.id.toString())) return

    args = Context.message.text.split(' ')
    if (!args[1] || !args[2]) return Context.reply("Incorrect syntax. Syntax is: /removeCredit <userId> <amount>")

    RemoveCredit(args[1], Number(args[2]))
    Context.reply("Done!")
})

telegram.command('banUser', async (Context) => {
    if (!config.admins.includes(Context.from.id.toString())) return

    args = Context.message.text.split(' ')
    if (!args[1]) return Context.reply("Incorrect syntax. Syntax is: /ban <userId>")

    BanUser(Number(args[1]))
    Context.reply("Done!")
})
telegram.command('unbanUser', async (Context) => {
    if (!config.admins.includes(Context.from.id.toString())) return

    args = Context.message.text.split(' ')
    if (!args[1]) return Context.reply("No user ID specified. Syntax is: /unban <userId>")

    UnbanUser(Number(args[1]))
    Context.reply("Done!")
})

telegram.command('refresh', async (Context) => {
    if (!config.admins.includes(Context.from.id.toString())) return

    Refresh()

    Context.reply("Done!")
})

telegram.command('decrypt', async (Context) => {
    if (!config.admins.includes(Context.from.id.toString())) return

    args = Context.message.text.split(' ')
    if (!args[1] || !args[2]) return Context.reply("Incorrect syntax. Syntax is: /decrypt <iv (before dot)> <content (after dot)>")

    Context.reply(decrypt({
        "iv": args[1],
        "content": args[2]
    }))
})

telegram.command('broadcast', async (Context) => {
    if (!config.admins.includes(Context.from.id.toString())) return

    args = Context.message.text.split(':')
    if (!args[1]) return Context.reply("Incorrect syntax. Syntax is: /broadcast:<message>")

    Broadcast(args[1])
})

telegram.command('addService', async (Context) => {
    if (!config.admins.includes(Context.from.id.toString())) return

    args = Context.message.text.split(' ')
    if (!args[1]) return Context.reply("Incorrect syntax. Syntax is: /addService <service>")

    if (accounts[args[1]]) {
        return Context.reply("Service already listed.")
    } else {
        accounts[args[1]] = []
        fs.writeFile("./json/accounts.json", JSON.stringify(accounts), _ => {})
        Context.reply("Done!")
    }
})

telegram.command('addAccount', async (Context) => {
    if (!config.admins.includes(Context.from.id.toString())) return

    args = Context.message.text.split(' ')
    if (!args[1]) return Context.reply("Incorrect syntax. Syntax is: /addAccount <service> <user:password>")

    if (accounts[args[1]]) {
        if (!args[2]) return Context.reply("Incorrect syntax. Syntax is: /addAccount <service> <user:password>")
        accounts[args[1]].available.push(args[2])
        fs.writeFile("./json/accounts.json", JSON.stringify(accounts), _ => {})
        Context.reply("Done!")
    } else {
        return Context.reply("Service not listed.")
    }
})

telegram.command('alertStatus', async (Context) => {
    if (!config.admins.includes(Context.from.id.toString())) return

    config.alertStatus = !config.alertStatus
    fs.writeFile("./json/accounts.json", JSON.stringify(accounts), _ => {})
})
// #endregion

// #region LAUNCHING BOT
function conditionalChaining(value) {
    if (value) {
        Broadcast("Client Online ✅")
    } else {
        return
    }
}
telegram.launch({
    dropPendingUpdates: true
}).then(
    conditionalChaining(config.alertStatus)
)
Log(`Client Ready.`)
// #endregion