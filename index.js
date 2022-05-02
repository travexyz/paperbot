console.clear()
const fs = require('fs')

// #region APP CONFIGURATION
var devMode = false
var supportChat = false
const config = require('./json/config.json')
var bans = require('./json/bans.json')
var balances = require('./json/balances.json')
var accounts = require('./json/accounts.json')
var methods = require('./json/methods.json')
// #endregion
// #region TELEGRAF CONFIGURATION
const {
    Telegraf
} = require('telegraf');
const {
    encrypt,
    decrypt
} = require('./core/crypt-utils')
const telegram = new Telegraf(process.env.TOKEN)
telegram.catch((err) => {
    console.error(err)
    config.admins.forEach(id => {
        telegram.telegram.sendMessage(id, "ERROR: Check logs!")
    })
})
// #endregion

// #region BOT FUNCTIONS
function checks(ctx) {
    if (devMode) {
        if (config.admins.includes(ctx.from.id.toString())) return true
        return false
    }
    if (bans.includes(ctx.chat.id)) return false

    if (!telegram.telegram.getChatMember(config.channel.id, ctx.from.id)) {
        ctx.telegram.sendMessage(ctx.chat.id, `<b>Paper Bot | Warning</b>\n\n<i>You must join the linked channel to start using the bot!</i>`, {
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

function createRecipt(ctx) {
    var id = ctx.chat.id
    var date = +Date.now()
    var uniqueCode = encrypt(`${ctx.from.username}.${id}.${date}`)

    return `${uniqueCode.iv}.${uniqueCode.content}`
}

function processAccountPayment(Name, Price, Context) {
    if (accounts[Name].length <= 0) return Context.answerCbQuery(`${Name.charAt(0).toUpperCase() + Name.slice(1)} accounts are out of stock.`, {
        show_alert: true
    })
    if (balances[Context.chat.id.toString()] < Price) return Context.answerCbQuery("You don't have enough money on your balance.", {
        show_alert: true
    })

    RemoveScredit(Context.chat.id, Price)

    var index = Math.floor(Math.random() * accounts[Name].length)
    var recipt = createRecipt(Context)
    Context.telegram.sendMessage(Context.chat.id, `<b>Paper Bot | ${Name.charAt(0).toUpperCase() + Name.slice(1)} Account</b>\n\n<b>✅ Credentials: </b><code>${accounts[Name][index]}</code>\n\n<b>🗒️ Recipt: </b> <code>${recipt}</code>`, {
        parse_mode: 'HTML'
    })
    Broadcast(`✅ <b>New Account Purchase!</b>\n<b>👤 Customer:</b> <a href="tg://user?id=${Context.from.id}">${Context.from.username}</a> (${Context.from.id})\n<b>📩 Product:</b> ${Name.charAt(0).toUpperCase() + Name.slice(1)} Account\n<b>💲 Price:</b> <code>${Price}</code>\n<b>📆 Date timestamp:</b> <code>${+ Date.now()}</code>\n<b>🗒️ Recipt: </b> <code>${recipt}</code>`)
}

function processMethodPayment(Name, Price, Context) {
    if (methods[Name].available) return Context.answerCbQuery(`${Name.charAt(0).toUpperCase() + Name.slice(1)} method is not available.`, {
        show_alert: true
    })
    if (balances[Context.chat.id.toString()] < Price) return Context.answerCbQuery("You don't have enough money on your balance.", {
        show_alert: true
    })

    RemoveScredit(Context.chat.id, Price)

    var recipt = createRecipt(Context)
    Context.telegram.sendMessage(Context.chat.id, `<b>Paper Bot | ${Name.charAt(0).toUpperCase() + Name.slice(1)} Account</b>\n\n<b>✅ Credentials: </b><code>${accounts[Name][index]}</code>\n\n<b>🗒️ Recipt: </b> <code>${recipt}</code>`, {
        parse_mode: 'HTML'
    })
    Broadcast(`✅ <b>New Method Purchase!</b>\n<b>👤 Customer:</b> <a href="tg://user?id=${Context.from.id}">${Context.from.username}</a> (${Context.from.id})\n<b>📩 Product:</b> ${Name.charAt(0).toUpperCase() + Name.slice(1)} Account\n<b>💲 Price:</b> <code>${Price}</code>\n<b>📆 Date timestamp:</b> <code>${+ Date.now()}</code>\n<b>🗒️ Recipt: </b> <code>${recipt}</code>`)
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

function RemoveScredit(userId, amount) {
    balances[userId] -= amount
    fs.writeFile("./json/balances.json", JSON.stringify(balances), _ => {})
}

function BanUser(userId) {
    bans.push(userId)
    fs.writeFile("./json/bans.json", JSON.stringify(balances), _ => {})
}

function UnbanUser(userId) {
    bans.splice(bans.indexOf(userId), 1)
    fs.writeFile("./json/bans.json", JSON.stringify(balances), _ => {})
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
telegram.start((ctx) => {
    if (!checks(ctx)) return

    if (!balances[ctx.from.id]) {
        SetCredit(ctx.from.id, 0.00)
    }

    console.log(`[${ + new Date()}] ${ctx.from.id} started the bot.`)

    ctx.telegram.sendMessage(ctx.chat.id, `<b>Paper Bot | Welcome!</b>`, {
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
telegram.action('main', (ctx) => {
    if (!checks(ctx)) return

    var buttons
    if (config.admins.includes(ctx.from.id.toString())) {
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

        ctx.editMessageText(`<b>Paper Bot | Main Menu</b>\n\n<i>Happy to see you here ${ctx.from.first_name}</i>`, {
            parse_mode: 'HTML',
            reply_markup: buttons
        })
})

telegram.action('shop', (ctx) => {
    if (!checks(ctx)) return


        ctx.editMessageText(`<b>Paper Bot | Shop</b>\n\n<b>💰 Balance: </b> <code>${balances[ctx.chat.id.toString()]}€</code>`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: '📂 Methods',
                        callback_data: 'methods'
                    }, {
                        text: '🎰 Accounts',
                        callback_data: 'accounts'
                    }, {
                        text: '👾 Scripts',
                        callback_data: 'scripts'
                    }],
                    [{
                        text: 'Go back',
                        callback_data: 'main'
                    }]
                ]
            }
        })
})

telegram.action('balance', (ctx) => {
    if (!checks(ctx)) return

        ctx.editMessageText(`<b>Paper Bot | Balance</b>\n\n💰 You currently have <code>${balances[ctx.chat.id.toString()]}€</code> on your account.`, {
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

telegram.action('developer', (ctx) => {
    if (!checks(ctx)) return

        ctx.editMessageText(`<b>Paper Bot | Developer Panel</b>`, {
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

telegram.action('showCommands', (ctx) => {
    if (!checks(ctx)) return

        ctx.editMessageText(`*Paper Bot | Available Commands*\n\n/addAccount <service> <user:password>\n\n/id - _returns chat id_\n\n/setCredit <userId> <amount>\n/addCredit <userId> <amount>\n/removeCredit <userId> <amount>\n\n/ban <userId>\n/unban <userId>\n\n/decrypt <iv> <content> - _decrypt text (usually recipts)_\n\n/broadcast:<message>\n\n/devMode - _enables bot to only admins_`, {
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

telegram.action('info', (ctx) => {
    if (!checks(ctx)) return

        ctx.editMessageText(`<b>Paper Bot | Info</b>\n\n<b>⚠️ In order to use support chat change your privacy for forwarded messages to proceed!</b>`, {
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
telegram.action('addFunds', (ctx) => {
    if (!checks(ctx)) return

    ctx.editMessageText(`<b>Paper Bot | Add Funds</b>\n\nCurrently accepted platforms:\n\n<b>• PayPal:</b> The amount of money recived will be added to your balance.\nUse Family & Friends option and send screenshot of the payment to ${config.payment.user} (add your Telegram username to the payment message for faster verification)`, {
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
telegram.action('startChat', (ctx) => {
    if (!checks(ctx)) return
    return ctx.answerCbQuery("Currently not available.", {
        show_alert: true
    })
    supportChat = true
    console.log(`[${ + new Date()}] ${ctx.from.id} started support chat.`)

    ctx.editMessageText(`<b>Paper Bot | Support Chat</b>\n\nYou are now chatting with support admins, press button below to exit.\n<b>⚠️ Change your privacy for forwarded messages to proceed!</b>`, {
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

    /* FORWARD METHOD (MAT NOT WORK DUE SETTINGS)
    telegram.on('message', (ctx) => {
        if (supportChat) {
            if (!config.admins.includes(ctx.from.id.toString())) {
                config.admins.forEach(id => {
                    ctx.forwardMessage(id)
                })
            }
            if (ctx.message.reply_to_message && config.admins.includes(ctx.from.id.toString())) {

                if (!ctx.message.reply_to_message.forward_from) {
                    ctx.reply(`Cannot send due to user privacy settings.`)
                    return
                }

                telegram.telegram.sendMessage(ctx.message.reply_to_message.chat.id, ctx.message.text)
            }
        }
    }) */

    /* PLAIN TEXT WITH DEEPLINK METHOD (UNABLE TO SEND REPLY TO CUSTOMER)
    telegram.on('message', (ctx) => {
        if (supportChat) {
            if (!config.admins.includes(ctx.from.id.toString())) {
                config.admins.forEach(id => {
                    telegram.telegram.sendMessage(id, `[${ctx.from.username}](tg://user?id=${ctx.from.id}): ${ctx.message.text}`, {
                        parse_mode: 'Markdown'
                    })
                })
            }

            if (ctx.message.reply_to_message && config.admins.includes(ctx.from.id.toString())) {

                // PROBLEM: find the user to send the message to
                // OPTION: cut string between "tg://user?id=" and ")"
            }
        }
    }) */

    telegram.action('stopChat', (ctx) => {
        supportChat = false
        console.log(`[${ + new Date()}] ${ctx.from.id} stopped support chat.`)


        ctx.editMessageText(`<b>Paper Bot | Support Chat</b>\n\nYou are now chatting with support admins, press button below to exit.\n<b>⚠️ Change your privacy for forwarded messages to proceed!</b>`, {
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
telegram.action('methods', (ctx) => {
    if (!checks(ctx)) return

        ctx.editMessageText(`<b>Paper Bot | Methods Menu</b>\n\n<i>Select your desidered method from below.</i>`, {
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

telegram.action('accounts', (ctx) => {
    if (!checks(ctx)) return

        ctx.editMessageText(`<b>Paper Bot | Accounts Menu</b>\n\n<i>Select your desidered account from below.</i>`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: `Netflix (${accounts.netflix.length})`,
                        callback_data: 'buyNetflixAccount'
                    }, {
                        text: `Spotify (${accounts.spotify.length})`,
                        callback_data: 'buySpotifyAccount'
                    }],
                    [{
                        text: 'Go back',
                        callback_data: 'shop'
                    }]
                ]
            }
        })

})

telegram.action('scripts', (ctx) => {
    if (!checks(ctx)) return

        ctx.editMessageText(`<b>Paper Bot | Scripts Menu</b>\n\n<i>Select your desidered script from below.</i>`, {
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
telegram.action('buyNetflixAccount', (ctx) => {
    if (!checks(ctx)) return

    ctx.editMessageText(`<b>Paper Bot | Netflix Account</b>\n\n<i>Premium cracked Netflix account.</i>\n<b>💰 Price: 0,50€</b>\n<b>♻️ Stock: ${accounts.netflix.length}</b>`, {
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
telegram.action('buySpotifyAccount', (ctx) => {
    if (!checks(ctx)) return

    ctx.editMessageText(`<b>Paper Bot | Spotify Account</b>\n\n<i>Premium cracked Spotify account.</i>\n<b>💰 Price: 0,50€</b>\n<b>♻️ Stock: ${accounts.netflix.length}</b>`, {
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
// #endregion
// #region PROCESSING PAYMENTS 
telegram.action('processNetflixAccount', (ctx) => {
    if (!checks(ctx)) return
    processAccountPayment("netflix", 0.50, ctx)
})
telegram.action('processSpotifyAccount', (ctx) => {
    if (!checks(ctx)) return
    processAccountPayment("spotify", 0.50, ctx)
})
// #endregion


// #region ADMIN COMMANDS
telegram.action('deleteMessage', (ctx) => {
    ctx.deleteMessage()
})

telegram.command('id', (ctx) => {
    ctx.reply(ctx.chat.id)
})

telegram.command('devMode', (ctx) => {
    if (!config.admins.includes(ctx.from.id.toString())) return
    devMode = devMode ? devMode = false : devMode = true

    ctx.reply(`Switched to: ${devMode}`)
})

telegram.command('setCredit', (ctx) => {
    if (!config.admins.includes(ctx.from.id.toString())) return

    args = ctx.message.text.split(' ')
    if (!args[1] || !args[2]) return ctx.reply("Incorrect syntax. Syntax is: /setCredit <userId> <amount>")

    SetCredit(args[1], Number(args[2]))
    ctx.reply("Done!")
})
telegram.command('addCredit', (ctx) => {
    if (!config.admins.includes(ctx.from.id.toString())) return

    args = ctx.message.text.split(' ')
    if (!args[1] || !args[2]) return ctx.reply("Incorrect syntax. Syntax is: /addCredit <userId> <amount>")

    AddCredit(args[1], Number(args[2]))
    ctx.reply("Done!")
})
telegram.command('removeCredit', (ctx) => {
    if (!config.admins.includes(ctx.from.id.toString())) return

    args = ctx.message.text.split(' ')
    if (!args[1] || !args[2]) return ctx.reply("Incorrect syntax. Syntax is: /removeCredit <userId> <amount>")

    RemoveScredit(args[1], Number(args[2]))
    ctx.reply("Done!")
})

telegram.command('banUser', (ctx) => {
    if (!config.admins.includes(ctx.from.id.toString())) return

    args = ctx.message.text.split(' ')
    if (!args[1]) return ctx.reply("Incorrect syntax. Syntax is: /ban <userId>")

    BanUser(Number(args[1]))
    ctx.reply("Done!")
})
telegram.command('unbanUser', (ctx) => {
    if (!config.admins.includes(ctx.from.id.toString())) return

    args = ctx.message.text.split(' ')
    if (!args[1]) return ctx.reply("No user ID specified. Syntax is: /unban <userId>")

    UnbanUser(Number(args[1]))
    ctx.reply("Done!")
})

telegram.command('refresh', (ctx) => {
    if (!config.admins.includes(ctx.from.id.toString())) return

    fs.readFile('./json/bans.json', 'utf8', (err, data) => {
        bans = JSON.parse(data)
    })
    fs.readFile('./json/balances.json', 'utf8', (err, data) => {
        balances = JSON.parse(data)
    })
    fs.readFile('./json/accounts.json', 'utf8', (err, data) => {
        accounts = JSON.parse(data)
    })

    ctx.reply("Done!")
})

telegram.command('decrypt', (ctx) => {
    if (!config.admins.includes(ctx.from.id.toString())) return

    args = ctx.message.text.split(' ')
    if (!args[1] || !args[2]) return ctx.reply("Incorrect syntax. Syntax is: /decrypt <iv (before dot)> <content (after dot)>")

    ctx.reply(decrypt({
        "iv": args[1],
        "content": args[2]
    }))
})

telegram.command('broadcast', (ctx) => {
    if (!config.admins.includes(ctx.from.id.toString())) return

    args = ctx.message.text.split(':')
    if (!args[1]) return ctx.reply("Incorrect syntax. Syntax is: /broadcast:<message>")

    Broadcast(args[1])
})

telegram.command('addService', (ctx) => {
    if (!config.admins.includes(ctx.from.id.toString())) return

    args = ctx.message.text.split(' ')
    if (!args[1]) return ctx.reply("Incorrect syntax. Syntax is: /addService <service>")

    if (accounts[args[1]]) {
        return ctx.reply("Service already listed.")
    } else {
        accounts[args[1]] = []
        fs.writeFile("./json/accounts.json", JSON.stringify(accounts), _ => {})
        console.log("Done!")
    }
})

telegram.command('addAccount', (ctx) => {
    if (!config.admins.includes(ctx.from.id.toString())) return

    args = ctx.message.text.split(' ')
    if (!args[1]) return ctx.reply("Incorrect syntax. Syntax is: /addAccount <service> <user:password>")

    if (accounts[args[1]]) {
        if (!args[2]) return ctx.reply("Incorrect syntax. Syntax is: /addAccount <service> <user:password>")
        accounts[args[1]].push(args[2])
        fs.writeFile("./json/accounts.json", JSON.stringify(accounts), _ => {})
        ctx.reply("Done!")
    } else {
        return ctx.reply("Service not listed.")
    }
})
// #endregion

// #region LAUNCHING BOT
telegram.launch({dropPendingUpdates: true}).then(
    config.admins.forEach(id => {
        telegram.telegram.sendMessage(id, `Client Online ✅`)
    })
)
console.log(`[${ + new Date()}] Client Ready.`)
// #endregion