// TODO: support chat, better user config bans and product management using DB.

// #region Envoirment Configuation
require('dotenv').config()
const { writeFileSync, readFileSync } = require('fs')
var Config = require("./config/config.json")
var Products = require("./config/products.json")
var Users = require("./config/users.json")
// #endregion

// #region Bot Configuration
const {
    Telegraf, Markup, Scenes, session
} = require('telegraf')

const client = new Telegraf(process.env.TOKEN)
client.catch((err) => {
    console.error(err)
    Config.administrators.forEach(id => {
        client.telegram.sendMessage(id, `Errore: \`\`\`${err}\`\`\``, { parse_mode: "MarkdownV2" })
    })
})

const updateFiles /* Aggiorna versioni locali dei file */ = _ => {
    writeFileSync("./config/config.json", JSON.stringify(Config))
    writeFileSync("./config/products.json", JSON.stringify(Products))
    writeFileSync("./config/users.json", JSON.stringify(Users))
}
// #endregion

//#region Wizards
const addProduct = new Scenes.WizardScene(
    'addproduct',
    (ctx) => {
        ctx.reply("Inserisci il nome del prodotto:")
        productInfo = {}
        return ctx.wizard.next()
    },
    (ctx) => {
        productInfo.name = ctx.message.text
        ctx.reply(`Inserisci il prezzo per il prodotto ${productInfo.name}:`)
        return ctx.wizard.next()
    },
    (ctx) => {
        productInfo.price = ctx.message.text
        ctx.reply(`Inserisci la quantità di ${productInfo.name} (-1 infinito, 0 terminato):`)
        return ctx.wizard.next()
    }, (ctx) => {
        productInfo.stock = ctx.message.text
        ctx.reply("Vuoi nascondere o mostrare il prodotto nella lista? (0 mostra, 1 nascondi)")
        return ctx.wizard.next()
    }, (ctx) => {
        productInfo.hidden = (ctx.message.text == "1") ? true : false
        Products.push(productInfo)
        updateFiles()
        ctx.reply(`Aggiunto prodotto ${(productInfo.hidden) ? "nascosto" : "visibile"} ${productInfo.name} (x${productInfo.stock}) al prezzo di ${productInfo.price}!`)
        return ctx.scene.leave()
    },
)

const editName = new Scenes.WizardScene(
    'editname',
    (ctx) => {
        ctx.reply("Inserisci il nuovo nome del prodotto:")
        return ctx.wizard.next()
    }, (ctx) => {
        Products[ctx.session.__scenes.state.product].name = ctx.message.text
        updateFiles()
        ctx.reply(`Modificato nome del prodotto in ${Products[ctx.session.__scenes.state.product].name}`)
        return ctx.scene.leave()
    },
)

const editPrice = new Scenes.WizardScene(
    'editprice',
    (ctx) => {
        ctx.reply("Inserisci il nuovo prezzo del prodotto:")
        return ctx.wizard.next()
    }, (ctx) => {
        Products[ctx.session.__scenes.state.product].price = ctx.message.text
        updateFiles()
        ctx.reply(`Modificato prezzo del prodotto in ${Products[ctx.session.__scenes.state.product].price}`)
        return ctx.scene.leave()
    },
)

const editStock = new Scenes.WizardScene(
    'editstock',
    (ctx) => {
        ctx.reply("Inserisci la nuova quantità del prodotto (-1 infinito, 0 terminato):")
        return ctx.wizard.next()
    }, (ctx) => {
        Products[ctx.session.__scenes.state.product].stock = ctx.message.text
        updateFiles()
        ctx.reply(`Modificata quantità del prodotto in ${Products[ctx.session.__scenes.state.product].stock}`)
        return ctx.scene.leave()
    },
)

const addAdmin = new Scenes.WizardScene(
    'addadmin',
    (ctx) => {
        ctx.reply("Inserisci l'ID dell'amministratore da aggiungere:")
        return ctx.wizard.next()
    },
    (ctx) => {
        id = ctx.message.text
        client.telegram.getChat(id)
            .then(chat => { ctx.reply(`Sei sicuro di voler aggiungere ${chat.username} (${id}) alla lista di amministratori? (0 no, 1 si)`) })
            .catch(err => { ctx.reply(`Impossibile trovare l'utente, verifica che l'ID (non l'username) sia corretto! Esco.`, { parse_mode: 'HTML' }); ctx.scene.leave() })
        return ctx.wizard.next()
    }, (ctx) => {
        if (ctx.message.text == "1") {
            Config.administrators.push(id)
            updateFiles()
            ctx.reply(`Utente aggiunto alla lista degli amministratori!`)
        } else {
            ctx.reply(`OK, utente NON aggiunto!`)
        }
        return ctx.scene.leave()
    },
)

const editMotd = new Scenes.WizardScene(
    'editmotd',
    (ctx) => {
        ctx.reply("Inserisci il nuovo MOTD da visualizzare:")
        return ctx.wizard.next()
    }, (ctx) => {
        Config.motd = ctx.message.text
        updateFiles()
        ctx.reply(`Nuovo MOTD impostato!`)
        return ctx.scene.leave()
    },
)

const setCredit = new Scenes.WizardScene(
    'setcredit',
    async (ctx) => {
        var user = Users[ctx.session.__scenes.state.userindex]
        var username
        await client.telegram.getChat(user.id)
            .then(chat => username = chat.username)

        ctx.reply(`Inserisci il valore di grana da impostare all'utente @${username} (${user.id}):`)
        return ctx.wizard.next()
    },
    (ctx) => {
        var credit = ctx.message.text
        Users[ctx.session.__scenes.state.userindex].balance = parseFloat(credit)
        updateFiles()
        ctx.reply(`Credito dell'utente impostato a ${Users[ctx.session.__scenes.state.userindex].balance}${Config.currency}`)
        return ctx.scene.leave()
    }
)

const addCredit = new Scenes.WizardScene(
    'addcredit',
    async (ctx) => {
        var user = Users[ctx.session.__scenes.state.userindex]
        var username
        await client.telegram.getChat(user.id)
            .then(chat => username = chat.username)

        ctx.reply(`Inserisci il valore di grana da aggiungere all'utente @${username} (${user.id}):`)
        return ctx.wizard.next()
    },
    (ctx) => {
        var credit = ctx.message.text
        Users[ctx.session.__scenes.state.userindex].balance += parseFloat(credit)
        updateFiles()
        ctx.reply(`Credito dell'utente dopo l'aggiunta: ${Users[ctx.session.__scenes.state.userindex].balance}${Config.currency}`)
        return ctx.scene.leave()
    }
)

const rmCredit = new Scenes.WizardScene(
    'rmcredit',
    async (ctx) => {
        var user = Users[ctx.session.__scenes.state.userindex]
        var username
        await client.telegram.getChat(user.id)
            .then(chat => username = chat.username)

        ctx.reply(`Inserisci il valore di grana da rimuovere all'utente @${username} (${user.id}):`)
        return ctx.wizard.next()
    },
    (ctx) => {
        var credit = ctx.message.text
        Users[ctx.session.__scenes.state.userindex].balance -= parseFloat(credit)
        updateFiles()
        ctx.reply(`Credito dell'utente dopo la rimozione: ${Users[ctx.session.__scenes.state.userindex].balance}${Config.currency}`)
        return ctx.scene.leave()
    }
)

client.use(session());
client.use(new Scenes.Stage([addProduct, editName, editPrice, editStock, addAdmin, editMotd, setCredit, addCredit, rmCredit]));
//#endregion

// #region Start Command
client.start(async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    updateFiles()
    if (!Users.find(usr => usr.id == Context.from.id)) {
        Users.push({id: Context.from.id, balance: 0})
    }

    Context.reply(`*${Config.shopName} Bot — Creato da ||travexyz||*`, {
        parse_mode: "MarkdownV2",
        ...Markup.inlineKeyboard([[Markup.button.callback("👽 Entra", "main")]])
    })
})
// #endregion

// #region Bot Actions
client.action("main", async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    await Context.editMessageText(`😎 Ciao <b>${Context.from.username}</b>, benvenuto in <b>${Config.shopName}</b>!\n\n${(Config.motd != null) ? `<code>${Config.motd}</code>` : `${new Date().toLocaleDateString()}`}`, { parse_mode: 'HTML' })

    if (Config.administrators.includes(Context.from.id)) {
        await Context.editMessageReplyMarkup({
            inline_keyboard: [
                [Markup.button.callback("📚 Prodotti", "products")],

                [Markup.button.callback("🪪 Account", "account"),
                Markup.button.callback("ℹ️ Info", "info")],

                [Markup.button.callback("🛠️ Pannello Amministratori", "panel")]
            ],
        })
    } else {
        await Context.editMessageReplyMarkup({
            inline_keyboard: [
                [Markup.button.callback("📚 Prodotti", "products")],

                [Markup.button.callback("🪪 Account", "account"),
                Markup.button.callback("ℹ️ Info", "info")],
            ],
        })
    }

})
//#endregion

// #region Menu Actions
client.action("products", async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    let message = `📚 <b>Prodotti di ${Config.shopName}\n</b>💰 <b>Grana:</b> <code>${Users.find(usr => usr.id == Context.from.id).balance}${Config.currency}</code>\n\n`
    Products.forEach(item => {
        if (item.hidden || !Config.administrators.includes(Context.from.id)) return

        let stock = item.stock
        if (item.stock == 0) {
            stock = "SOLD OUT"
        } else if (item.stock == -1) {
            stock = "UNLIMITED"
        }
        message += `<b>‼️ ${item.name}</b>\n💸 Prezzo: <code>${item.price}$</code>\n🎰 Stock: <code>${stock}</code>\n\n`
    })
    await Context.editMessageText(message, { parse_mode: 'HTML' })

    let markup = {
        inline_keyboard: [
            [Markup.button.url("💫 Acquista", "tg://user?id=304506948"),
            Markup.button.callback("↩️ Indietro", "main")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})

client.action("account", async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    let pisello = Math.floor(Math.random() * 20)
    await Context.editMessageText(`👤 <b>Username</b> <code>${Context.from.username}</code>${(Config.administrators.includes(Context.from.id)) ? " <i>amministratore</i>" : ""}
🆔 <b>ID:</b> <code>${Context.from.id}</code>
💵 <b>Grana:</b> <code>${Users.find(usr => usr.id == Context.from.id).balance}${Config.currency}</code>
📏 <b>Pisello (variabile):</b> <code>${pisello}cm ${(pisello > 10) ? "😱" : "😮‍💨"}</code>`, { parse_mode: 'HTML' })

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "main")]
        ]
    })
})

client.action("info", async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    await Context.editMessageText("*🤖 Creato da ||travexyz|| con tanto ||❤️|| in nodejs*", { parse_mode: 'MarkdownV2' })

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.url("Contatta Sviluppatore", "tg://user?id=304506948")],
            [Markup.button.callback("↩️ Indietro", "main")]
        ]
    })
})

client.action("panel", async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    await Context.editMessageText(`<b>🛠️ Pannello Amministratori</b>`, { parse_mode: 'HTML' })

    let markup = {
        inline_keyboard: [
            [Markup.button.callback("➕ Aggiungi Prodotto", "addproduct"),
            Markup.button.callback("❌ Rimuovi Prodotto", "rmproduct")],
            [Markup.button.callback("✍️ Modifica Prodotto", "editproduct")],
            [Markup.button.callback("➕ Aggiungi Admin", "addadmin"),
            Markup.button.callback("❌ Rimuovi Admin", "rmadmin")],
            [Markup.button.callback("👥 Gestione Utenti", "manageusers")],
            [Markup.button.callback("🔄 Aggiorna Variabili", "refreshvars")], 
            [Markup.button.callback("📣 Trasmetti messaggio", "broadcast")],
            [Markup.button.callback("📝 Modifica MOTD", "motd")],
            [Markup.button.callback("↩️ Indietro", "main")]
        ]
    }

    await Context.editMessageReplyMarkup(markup)
})
// #endregion

//#region Panel Actions
//#region Action: aggiungi prodotto
client.action("addproduct", async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    await Context.scene.enter("addproduct")
})
//#endregion
//#region Azione: rimuovi prodotto
client.action("rmproduct", async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    await Context.editMessageText(`<b>Seleziona il prodotto che vuoi rimuovere:</b>`, { parse_mode: 'HTML' })

    let keyboard = []
    Products.forEach(item => {
        keyboard.push([Markup.button.callback(item.name, `rmproduct-${Products.indexOf(item)}`)])
    })
    keyboard.push([Markup.button.callback("↩️ Indietro", "panel")])
    let markup = {
        inline_keyboard: keyboard
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^rmproduct-\d{1,}/, async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    await Context.editMessageText(`<b>Sei sicuro che vuoi eliminare il prodotto? <code>nome: ${Products[index].name}</code>\n<code>prezzo: ${Products[index].price}</code>\n<code>stock: ${Products[index].stock}</code>\n<code>visibiltà: ${(Products[index].hidden ? "nascosto" : "visibile")}</code></b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `productrm-${Products.indexOf(Products[index])}`), Markup.button.callback("❌", "rmproduct")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^productrm-\d{1,}/, async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    delete Products[index]
    Products = Products.filter(Number) // Rimuove elementi null
    updateFiles()

    await Context.editMessageText(`<b>Prodotto eliminato!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "rmproduct")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
//#endregion
//#region Azione: modifica prodotto
client.action("editproduct", async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    await Context.editMessageText(`<b>Seleziona il prodotto che vuoi modificare:</b>`, { parse_mode: 'HTML' })

    let keyboard = []
    Products.forEach(item => {
        keyboard.push([Markup.button.callback(item.name, `editproduct-${Products.indexOf(item)}`)])
    })
    keyboard.push([Markup.button.callback("↩️ Indietro", "panel")])
    let markup = {
        inline_keyboard: keyboard
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^editproduct-\d{1,}/, async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    let product = Products[index]
    await Context.editMessageText(`<b>Cosa vuoi cambiare del prodotto?\n<code>nome: ${Products[index].name}</code>\n<code>prezzo: ${Products[index].price}</code>\n<code>stock: ${Products[index].stock}</code>\n<code>visibiltà: ${(Products[index].hidden ? "nascosto" : "visibile")}</code></b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("Nome", `changename-${Products.indexOf(product)}`), Markup.button.callback("Prezzo", `changeprice-${Products.indexOf(product)}`), Markup.button.callback("Stock", `changestock-${Products.indexOf(product)}`)],
            [Markup.button.callback("Visibilita", `changevis-${Products.indexOf(product)}`)],
            [Markup.button.callback("↩️ Indietro", "editproduct")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^changename-\d{1,}/, async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    await Context.scene.enter("editname", { product: index })
})
client.action(/^changeprice-\d{1,}/, async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    await Context.scene.enter("editprice", { product: index })
})
client.action(/^changestock-\d{1,}/, async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    await Context.scene.enter("editstock", { product: index })
})

client.action(/^changevis-\d{1,}/, async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    await Context.editMessageText(`<b>Vuoi nascondere o mostrare il prodotto <code>${Products[index].name}</code>? (adesso è ${(Products[index].hidden) ? "nascosto" : "mostrato"})</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("Nascondi", `hide-${Products.indexOf(Products[index])}`), Markup.button.callback("Mostra", `show-${Products.indexOf(Products[index])}`)]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^hide-\d{1,}/, async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    Products[index].hidden = true
    updateFiles()

    await Context.editMessageText(`<b>Prodotto <code>${Products[index].name}</code> nascosto!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "editproduct")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^show-\d{1,}/, async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    Products[index].hidden = false
    updateFiles()

    await Context.editMessageText(`<b>Il prodotto <code>${Products[index].name}</code> è ora visibile!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "editproduct")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
//#endregion

//#region Azione: Gestione utente
client.action("manageusers", async Context => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return

    let message = "<b>👥 Utenti Salvati:</b>\n"
    Users.forEach(async user => {
        message += `- <code>${user.id}</code>${(Config.administrators.includes(user.id)) ? ": amministratore\n" : ": utente\n"}`
    })
    message += "\n<b>‼️ Seleziona un utente per gestirlo:</b>"
    await Context.editMessageText(message, { parse_mode: 'HTML' })

    let keyboard = []
    Users.forEach(async (user) => {
        keyboard.push([Markup.button.callback(user.id, `manageuser-${Users.indexOf(user)}`)])
    })
    keyboard.push([Markup.button.callback("↩️ Indietro", "panel")])
    let markup = {
        inline_keyboard: keyboard
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^manageuser-\d{1,}/, async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    let user = Users[index]
    let username
    await client.telegram.getChat(user.id)
        .then(chat => username = chat.username)

    await Context.editMessageText(`<b>‼️ Utente</b> <code>${username}</code> <code>(${user.id})</code>\n💵 <b>Grana:</b> <code>${user.balance}${Config.currency}</code>\n🛠️ <b>Amministratore:</b> <code>${(Config.administrators.includes(user.id)) ? "Yes" : "No"}</code>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("Imposta Credito", `setcredit-${Users.indexOf(user)}`), Markup.button.callback("Aggiungi Credito", `addcredit-${Users.indexOf(user)}`), Markup.button.callback("Rimuovi Credito", `rmcredit-${Users.indexOf(user)}`)],
            [Markup.button.callback("Bandisci", `banuser-${Users.indexOf(user)}`)],
            [Markup.button.callback("↩️ Indietro", "manageusers")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})

client.action(/^setcredit-\d{1,}/, async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    await Context.scene.enter("setcredit", { userindex: index })
})
client.action(/^addcredit-\d{1,}/, async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    await Context.scene.enter("addcredit", { userindex: index })
})
client.action(/^rmcredit-\d{1,}/, async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    await Context.scene.enter("rmcredit", { userindex: index })
})
client.action(/^banuser-\d{1,}/, async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    let username
    await client.telegram.getChat(Users[index].id)
        .then(chat => username = chat.username)

    await Context.editMessageText(`<b>Sei sicuro di voler bandire <code>${username} (${Users[index].id})</code> dall'utilizzo del bot?</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `userban-${Users.indexOf(Users[index])}`), Markup.button.callback("❌", `manageuser-${index}`)]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^userban-\d{1,}/, async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    Config.bans.push(Users[index].id)
    updateFiles()

    await Context.editMessageText(`<b>Utente bandito dal bot!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", `manageuser-${index}`)]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
//#endregion

//#region Azione: aggiungi amministratore
client.action("addadmin", async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    await Context.scene.enter("addadmin")
})
//#endregion
//#region Azione: rimuovi amministratore
client.action("rmadmin", async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    await Context.editMessageText(`<b>Seleziona l'amministratore da rimuovere:</b>`, { parse_mode: 'HTML' })

    let keyboard = []
    Config.administrators.forEach(item => {
        keyboard.push([Markup.button.callback(item, `rmadmin-${Config.administrators.indexOf(item)}`)])
    })
    keyboard.push([Markup.button.callback("↩️ Indietro", "panel")])
    let markup = {
        inline_keyboard: keyboard
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^rmadmin-\d{1,}/, async (Context) => {
    console.log(1)
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    let username
    client.telegram.getChat(Config.administrators[index])
        .then(chat => username = chat.username)

    await Context.editMessageText(`<b>Sei sicuro che voui rimuovere <code>${username} (${Config.administrators[index]})</code> dagli amministratori?</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `adminrm-${Config.administrators.indexOf(Config.administrators[index])}`), Markup.button.callback("❌", "rmadmin")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^adminrm-\d{1,}/, async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    let index = Context.match[0].split("-")[1]
    Config.administrators.splice(index, 1)
    updateFiles()

    await Context.editMessageText(`<b>Utente rimosso dalla lista degli amministratori!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "rmadmin")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
//#endregion

client.action("refreshvars", async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    await Context.editMessageText(`<b>Sei sicuro di voler aggiornare le variabili dai file?</b>\n<b>⚠️ Esegui questo comando solo se sai bene cosa stai facendo!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `varsrefresh`), Markup.button.callback("❌", "panel")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})

client.action("varsrefresh", async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    Config = readFileSync("./config/config.json")
    Products = readFileSync("./config/products.json")
    Users = readFileSync("./config/users.json")
    await Context.editMessageText(`<b>Variabili aggiornate!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [ Markup.button.callback("↩️ Indietro", "panel")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})

//#region MOTD
client.action("motd", async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    await Context.editMessageText(`Il MOTD corrente è: <code>${Config.motd}</code>`, { parse_mode: 'HTML' })

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.callback("Cambia", "editmotd"), Markup.button.callback("Rimuovi", "rmmotd")],
            [Markup.button.callback("↩️ Indietro", "panel")]
        ]
    })
})
client.action("editmotd", async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    await Context.scene.enter("editmotd")
})
client.action("rmmotd", async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    await Context.editMessageText(`<b>Sei sicuro di voler rimuovere il MOTD corrente?</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `motdrm`), Markup.button.callback("❌", "motd")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action("motdrm", async (Context) => {
    if (Config.bans.includes(Context.chat.id)) return
    if (!Config.administrators.includes(Context.chat.id)) return
    Config.motd = null
    updateFiles()
    await Context.editMessageText(`<b>MOTD rimosso!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "motd")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
//#endregion
//#endregion

// #region Launching
client.launch({
    dropPendingUpdates: true
})
process.once("SIGINT", () => client.stop("SIGINT"))
process.once("SIGTERM", () => client.stop("SIGTERM"))
// #endregion