// #region Envoirment Configuation
require('dotenv').config()
const debug = true
const mysql = require('mysql2/promise')
// #endregion

//#region DB
const pool = mysql.createPool({
    connectionLimit: 50,
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPWD,
    database: process.env.DBNAME
})
//#endregion

// #region Bot Configuration
const {
    Telegraf, Markup, Scenes, session, Context, deunionize
} = require('telegraf')

const client = new Telegraf(process.env.TOKEN)
client.catch(async (e) => {
    console.error(e)
    await pool.query("SELECT * FROM users WHERE admin=TRUE")
    results.forEach(admin => { client.telegram.sendMessage(admin.userID, `Errore: \`\`\`${e}\`\`\``, { parse_mode: "MarkdownV2" }) })

})

getProducts = async () => {
    return pool.query('SELECT * FROM products')
}

getUsers = async () => {
    return pool.query('SELECT * FROM users')
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
        ctx.reply("Vuoi nascondere o mostrare il prodotto nella lista? (0 nascondi, 1 mostra)")
        return ctx.wizard.next()
    }, async (ctx) => {
        productInfo.visible = (ctx.message.text == "0") ? true : false
        await pool.query(`INSERT INTO products (name, price, stock, visible) VALUES (?, ?, ?, ?)`, [`${productInfo.name}`, productInfo.price, productInfo.stock, ((productInfo.visible) ? 1 : 0)])
        if (debug) console.warn(`${Date.now()} product added. product name: ${productInfo.name}`)
        ctx.reply(`Prodotto aggiunto!`)
        return ctx.scene.leave()
    },
)

const editName = new Scenes.WizardScene(
    'editname',
    (ctx) => {
        ctx.reply("Inserisci il nuovo nome del prodotto:")// 
        return ctx.wizard.next()
    }, async (ctx) => {
        await pool.query(`UPDATE products SET name=? WHERE id=?`, [`${ctx.message.text}`, `${ctx.session.__scenes.state.productId}`])
        if (debug) console.warn(`${Date.now()} product name changed (${ctx.message.text}). victim product key: ${ctx.session.__scenes.state.productId}`)
        ctx.reply(`Modificato nome del prodotto in ${ctx.message.text}`)
        return ctx.scene.leave()
    },
)

const editPrice = new Scenes.WizardScene(
    'editprice',
    (ctx) => {
        ctx.reply("Inserisci il nuovo prezzo del prodotto:")
        return ctx.wizard.next()
    }, async (ctx) => {
        await pool.query(`UPDATE products SET price=? WHERE id=?`, [`${ctx.message.text}`, `${ctx.session.__scenes.state.productId}`])
        if (debug) console.warn(`${Date.now()} product price changed (${ctx.message.text}). victim product key: ${ctx.session.__scenes.state.productId}`)
        ctx.reply(`Modificato prezzo del prodotto in ${ctx.message.text}`)
        return ctx.scene.leave()
    },
)

const editStock = new Scenes.WizardScene(
    'editstock',
    (ctx) => {
        ctx.reply("Inserisci la nuova quantità del prodotto (-1 infinito, 0 terminato):")
        return ctx.wizard.next()
    }, async (ctx) => {
        await pool.query(`UPDATE products SET stock=? WHERE id=?`, [`${ctx.message.text}`, `${ctx.session.__scenes.state.productId}`])
        if (debug) console.warn(`${Date.now()} product stock changed (${ctx.message.text}). victim product key: ${ctx.session.__scenes.state.productId}`)
        ctx.reply(`Modificata quantità del prodotto in ${ctx.message.text}`)
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
    }, async (ctx) => {
        if (ctx.message.text == "1") {
            await pool.query(`UPDATE users SET admin=TRUE WHERE id=?`, [id])
            if (debug) console.warn(`${Date.now()} user added as admin. victim user key: ${id}`)
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
        ctx.reply("Inserisci il nuovo Messaggio del Giorno da visualizzare:")
        return ctx.wizard.next()
    }, async (ctx) => {
        await pool.query(`UPDATE config SET motd=?`, [`${ctx.message.text}`])
        if (debug) console.warn(`${Date.now()} motd edited. author user telegram id ${ctx.from.id}`)
        ctx.reply(`Nuovo Messaggio del Giorno impostato!`)
        return ctx.scene.leave()
    },
)

const editShopName = new Scenes.WizardScene(
    'editshopname',
    (ctx) => {
        ctx.reply("Inserisci il nuovo nome dello shop da visualizzare:")
        return ctx.wizard.next()
    }, async (ctx) => {
        await pool.query(`UPDATE config SET shopname=?`, [`${ctx.message.text}`])
        if (debug) console.warn(`${Date.now()} shopname edited. author user telegram id ${ctx.from.id}`)
        ctx.reply(`Nuovo nome shop impostato!`)
        return ctx.scene.leave()
    },
)

const setCredit = new Scenes.WizardScene(
    'setcredit',
    async (ctx) => {
        const Users = (await getUsers())[0]
        var user = Users.find(usr => usr.id == parseInt(ctx.session.__scenes.state.id))
        var username
        await client.telegram.getChat(user.userID)
            .then(chat => username = chat.username)

        ctx.reply(`Inserisci il valore di grana da impostare all'utente ${username} (${user.userID}):`)
        return ctx.wizard.next()
    },
    async (ctx) => {
        var credit = ctx.message.text
        await pool.query(`UPDATE users SET balance=? WHERE id=?`, [parseFloat(credit), ctx.session.__scenes.state.id])
        if (debug) console.warn(`${Date.now()} user credit changed to ${parseFloat(credit)}. victim user key: ${ctx.session.__scenes.state.id}, author user telegram id: ${ctx.from.id}`)
        ctx.reply(`Credito dell'utente impostato a ${credit}`)
        return ctx.scene.leave()
    }
)

const addCredit = new Scenes.WizardScene(
    'addcredit',
    async (ctx) => {
        const Users = (await getUsers())[0]
        var user = Users.find(usr => usr.id == ctx.session.__scenes.state.id)
        var username
        await client.telegram.getChat(user.userID)
            .then(chat => username = chat.username)

        ctx.reply(`Inserisci il valore di grana da aggiungere all'utente ${username} (${user.userID}):`)
        return ctx.wizard.next()
    },
    async (ctx) => {
        const Users = (await getUsers())[0]
        var user = Users.find(usr => usr.id == ctx.session.__scenes.state.id)
        var credit = user.balance + (parseFloat(ctx.message.text))
        await pool.query(`UPDATE users SET balance=? WHERE id=?`, [credit, ctx.session.__scenes.state.id])
        if (debug) console.warn(`${Date.now()} user credit changed (${parseFloat(credit)}). victim user key: ${ctx.session.__scenes.state.id}, author user telegram id: ${ctx.from.id}`)
        ctx.reply(`Credito dell'utente dopo l'aggiunta: ${credit}`)
        return ctx.scene.leave()
    }
)

const rmCredit = new Scenes.WizardScene(
    'rmcredit',
    async (ctx) => {
        const Users = (await getUsers())[0]
        var user = Users.find(usr => usr.id == ctx.session.__scenes.state.id)
        var username
        await client.telegram.getChat(user.userID)
            .then(chat => username = chat.username)

        ctx.reply(`Inserisci il valore di grana da rimuovere all'utente ${username} (${user.userID}):`)
        return ctx.wizard.next()
    },
    async (ctx) => {
        const Users = (await getUsers())[0]
        var user = Users.find(usr => usr.id == ctx.session.__scenes.state.id)
        var credit = user.balance - (parseFloat(ctx.message.text))
        await pool.query(`UPDATE users SET balance=? WHERE id=?`, [credit, ctx.session.__scenes.state.id])
        if (debug) console.warn(`${Date.now()} user credit changed (${parseFloat(credit)}). victim user key: ${ctx.session.__scenes.state.id}, author user telegram id: ${ctx.from.id}`)
        ctx.reply(`Credito dell'utente dopo la rimozione: ${credit}`)
        return ctx.scene.leave()
    }
)

const broadcast = new Scenes.WizardScene(
    'broadcast',
    (ctx) => {
        ctx.reply("Inserisci il messaggio che vuoi mandare a tutti gli utenti del bot:")
        return ctx.wizard.next()
    }, async (ctx) => {
        const Users = (await getUsers())[0]
        Users.forEach(user => {
            client.telegram.sendMessage(user.id, ctx.message.text)
        })
        if (debug) console.warn(`${Date.now()} broadcasted message "${ctx.message.text}", author user telegram id ${ctx.from.id}`)
        return ctx.scene.leave()
    }
)

client.use(session());
client.use(new Scenes.Stage([addProduct, editName, editPrice, editStock, addAdmin, editMotd, setCredit, addCredit, rmCredit, editShopName]));
//#endregion

// #region Start Command
client.start(async (Context) => {
    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (!user) {
        await pool.query(`INSERT INTO users (userID, balance, admin, banned) VALUES (?, 0.00, 0, 0)`, [Context.chat.id])
        if (debug) console.warn(`${Date.now()} new user added to db. user telegram id: ${Context.chat.id}`)
    } else {
        if (user.banned) return
    }
    const Config = (await pool.query(`SELECT * FROM config`))[0][0]
    Context.reply(`*${Config.shopname} Bot — Creato da ||travexyz||*`, {
        parse_mode: "MarkdownV2",
        ...Markup.inlineKeyboard([[Markup.button.callback("👽 Entra", "main")]])
    })
})
// #endregion

// #region Bot Actions
client.action("main", async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    const Config = (await pool.query(`SELECT * FROM config`))[0][0]
    await Context.editMessageText(`😎 Ciao <b>${(Context.from.username) ? Context.from.username : Context.from.first_name}</b>, benvenuto in <b>${Config.shopname}</b>!\n\n${(Config.motd != null) ? `<code>${Config.motd}</code>` : `${new Date().toLocaleDateString()}`}`, { parse_mode: 'HTML' })

    if (user.admin) {
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

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return

    const Config = (await pool.query(`SELECT * FROM config`))[0][0]
    let message = `📚 <b>Prodotti di ${Config.shopname}\n</b>💰 <b>Grana:</b> <code>${user.balance}${Config.currency}</code>\n\n`

    var Products = await getProducts()
    Products[0].forEach(item => {
        if (item.hidden && !user.admin) return

        let stock = item.stock
        if (item.stock == 0) {
            stock = "SOLD OUT"
        } else if (item.stock == -1) {
            stock = "UNLIMITED"
        }
        message += `<b>‼️ ${item.name}</b>\n💸 Prezzo: <code>${item.price}${Config.currency}</code>\n🎰 Stock: <code>${stock}</code>\n\n`
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

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return

    const Config = (await pool.query(`SELECT * FROM config`))[0][0]
    let pisello = Math.floor(Math.random() * 20)
    await Context.editMessageText(`👤 <b>Username</b> <code>${Context.chat.username}</code>${(user.admin) ? " <i>amministratore</i>" : ""}
🆔 <b>ID:</b> <code>${Context.chat.id}</code>
💵 <b>Grana:</b> <code>${user.balance}${Config.currency}</code>
📏 <b>Pisello (variabile):</b> <code>${pisello}cm ${(pisello > 10) ? "😱" : "😮‍💨"}</code>`, { parse_mode: 'HTML' })

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "main")]
        ]
    })
})

client.action("info", async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    await Context.editMessageText("*🤖 Creato da ||travexyz|| con tanto ||❤️|| in nodejs*", { parse_mode: 'MarkdownV2' })

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.url("Contatta Sviluppatore", "tg://user?id=304506948")],
            [Markup.button.callback("↩️ Indietro", "main")]
        ]
    })
})

client.action("panel", async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.editMessageText(`<b>🛠️ Pannello Amministratori</b>`, { parse_mode: 'HTML' })

    let markup = {
        inline_keyboard: [
            [Markup.button.callback("➕ Aggiungi Prodotto", "addproduct"),
            Markup.button.callback("❌ Rimuovi Prodotto", "rmproduct")],
            [Markup.button.callback("✍️ Modifica Prodotto", "editproduct")],
            [Markup.button.callback("➕ Aggiungi Admin", "addadmin"),
            Markup.button.callback("❌ Rimuovi Admin", "rmadmin")],
            [Markup.button.callback("👥 Gestisci Utenti", "manageusers")],
            [Markup.button.callback("📣 Trasmetti messaggio", "broadcast")],
            [Markup.button.callback("📝 Configurazione Bot", "config")],
            [Markup.button.callback("↩️ Indietro", "main")]
        ]
    }

    await Context.editMessageReplyMarkup(markup)
})
// #endregion

//#region Panel Actions
//#region Azione: aggiungi prodotto
client.action("addproduct", async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.scene.enter("addproduct")
})
//#endregion
//#region Azione: rimuovi prodotto
client.action("rmproduct", async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.editMessageText(`<b>Seleziona il prodotto che vuoi rimuovere:</b>`, { parse_mode: 'HTML' })

    let keyboard = []
    var Products = await getProducts()
    Products[0].forEach(item => {
        keyboard.push([Markup.button.callback(item.name, `rmproduct-${item.id}`)])
    })
    keyboard.push([Markup.button.callback("↩️ Indietro", "panel")])
    let markup = {
        inline_keyboard: keyboard
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^rmproduct-\d{1,}/, async (Context) => {
    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]
    var product = (await pool.query(`SELECT * FROM products WHERE id=?`, [id]))[0][0]

    await Context.editMessageText(`<b>Sei sicuro che vuoi eliminare il prodotto? <code>nome: ${product.name}</code>\n<code>prezzo: ${product.price}</code>\n<code>stock: ${product.stock}</code>\n<code>visibiltà: ${(product.visible ? "mostrato" : "nascosto")}</code></b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `productrm-${product.id}`), Markup.button.callback("❌", "rmproduct")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^productrm-\d{1,}/, async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]
    await pool.query(`DELETE FROM products WHERE id=?`, [id])
    if (debug) console.warn(`${Date.now()} product deleted. victim product key: ${id}, author user key: ${user.id}`)
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

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.editMessageText(`<b>Seleziona il prodotto che vuoi modificare:</b>`, { parse_mode: 'HTML' })

    let keyboard = []
    Products = await getProducts()
    Products[0].forEach(item => {
        keyboard.push([Markup.button.callback(item.name, `editproduct-${item.id}`)])
    })
    keyboard.push([Markup.button.callback("↩️ Indietro", "panel")])
    let markup = {
        inline_keyboard: keyboard
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^editproduct-\d{1,}/, async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]
    var product = (await pool.query(`SELECT * FROM products WHERE id=?`, [id]))[0][0]
    await Context.editMessageText(`<b>Cosa vuoi cambiare del prodotto?\n<code>nome: ${product.name}</code>\n<code>prezzo: ${product.price}</code>\n<code>stock: ${product.stock}</code>\n<code>visibiltà: ${(product.visible ? "mostrato" : "nascosto")}</code></b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("Nome", `changename-${product.id}`), Markup.button.callback("Prezzo", `changeprice-${product.id}`), Markup.button.callback("Stock", `changestock-${product.id}`)],
            [Markup.button.callback("Visibilita", `changevis-${product.id}`)],
            [Markup.button.callback("↩️ Indietro", "editproduct")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^changename-\d{1,}/, async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("editname", { productId: id })
})
client.action(/^changeprice-\d{1,}/, async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("editprice", { productId: id })
})
client.action(/^changestock-\d{1,}/, async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("editstock", { productId: id })
})

client.action(/^changevis-\d{1,}/, async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]
    var product
    product = (await pool.query(`SELECT * FROM products WHERE id=?`, [id]))[0][0]
    await Context.editMessageText(`<b>Vuoi nascondere o mostrare il prodotto <code>${product.name}</code>? (adesso è ${(product.visible) ? "mostrato" : "nascosto"})</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("Nascondi", `hide-${product.id}`), Markup.button.callback("Mostra", `show-${product.id}`)]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^hide-\d{1,}/, async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]

    await pool.query(`UPDATE products SET visible=FALSE WHERE id=?`, [id])

    await Context.editMessageText(`<b>Prodotto nascosto!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", `editproduct-${id}`)]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^show-\d{1,}/, async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]

    await pool.query(`UPDATE products SET visible=TRUE WHERE id=?`, [id])

    await Context.editMessageText(`<b>Il prodotto è ora visibile!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", `editproduct-${id}`)]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
//#endregion

//#region Azione: aggiungi amministratore
client.action("addadmin", async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.editMessageText(`<b>Sei sicuro di voler aggiungere un nuovo amministratore?</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `adminadd`), Markup.button.callback("❌", "panel")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action("adminadd", async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.scene.enter("addadmin")
})
//#endregion
//#region Azione: rimuovi amministratore
client.action("rmadmin", async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.editMessageText(`<b>Seleziona l'amministratore da rimuovere:</b>`, { parse_mode: 'HTML' })

    let keyboard = []
    Users.forEach(item => {
        if (item.admin) {
            keyboard.push([Markup.button.callback(item.userID, `rmadmin-${item.id}`)])
        }
    })
    keyboard.push([Markup.button.callback("↩️ Indietro", "panel")])
    let markup = {
        inline_keyboard: keyboard
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^rmadmin-\d{1,}/, async (Context) => {
    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    let id = Context.match[0].split("-")[1]
    const victim_user = (await pool.query(`SELECT * FROM users WHERE id=?`, [id]))[0][0]
    var username
    await client.telegram.getChat(victim_user.userID)
        .then(chat => {
            if (!chat.username) {
                username = chat.first_name + " " + ((chat.last_name) ? chat.last_name : "(no username)")
            } else {
                username = chat.username
            }
        })

    await Context.editMessageText(`<b>Sei sicuro che vuoi rimuovere <code>${username} (${victim_user.userID})</code> dagli amministratori?</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `adminrm-${victim_user.id}`), Markup.button.callback("❌", "rmadmin")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^adminrm-\d{1,}/, async (Context) => {
    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    let id = Context.match[0].split("-")[1]
    await pool.query(`UPDATE users SET admin=FALSE WHERE id=?`, [id])
    if (debug) console.warn(`${Date.now()} removed from admin role. victim user key: ${id}, author user key: ${user.id}`)
    await Context.editMessageText(`<b>Utente rimosso dalla lista degli amministratori!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "rmadmin")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
//#endregion

//#region Azione: Gestione utenti
client.action("manageusers", async Context => {
    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let message = "<b>👥 Utenti Salvati:</b>\n"
    Users.forEach(async user => {
        message += `- <code>${user.userID}</code>${(user.admin) ? ": amministratore\n" : ": utente\n"}`
    })
    message += "\n<b>‼️ Seleziona un utente per gestirlo:</b>"
    await Context.editMessageText(message, { parse_mode: 'HTML' })

    let keyboard = []
    Users.forEach(async (usr) => {
        keyboard.push([Markup.button.callback(usr.userID, `manageuser-${usr.id}`)])
    })
    keyboard.push([Markup.button.callback("↩️ Indietro", "panel")])
    let markup = {
        inline_keyboard: keyboard
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^manageuser-\d{1,}/, async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    const Config = (await pool.query(`SELECT * FROM config`))[0][0]
    var id = Context.match[0].split("-")[1]
    victim_user = (await pool.query(`SELECT * FROM users WHERE id=?`, [id]))[0][0]
    var username
    await client.telegram.getChat(victim_user.userID)
        .then(chat => {
            if (!chat.username) {
                username = chat.first_name + " " + ((chat.last_name) ? chat.last_name : "(no username)")
            } else {
                username = chat.username
            }
        })

    await Context.editMessageText(`<b>‼️ Utente</b> <code>${username}</code>\nID: <code>${victim_user.userID}</code>\n💵 <b>Grana:</b> <code>${victim_user.balance}${Config.currency}</code>\n🛠️ <b>Amministratore:</b> <code>${(victim_user.admin) ? "Yes" : "No"}</code>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("Imposta Credito", `setcredit-${victim_user.id}`), Markup.button.callback("Aggiungi Credito", `addcredit-${victim_user.id}`), Markup.button.callback("Rimuovi Credito", `rmcredit-${victim_user.id}`)],
            [Markup.button.callback("Bandisci", `banuser-${victim_user.id}`)],
            [Markup.button.callback("↩️ Indietro", "manageusers")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})

client.action(/^setcredit-\d{1,}/, async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("setcredit", { id: id })
})
client.action(/^addcredit-\d{1,}/, async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("addcredit", { id: id })
})
client.action(/^rmcredit-\d{1,}/, async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("rmcredit", { id: id })
})
client.action(/^banuser-\d{1,}/, async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    let id = Context.match[0].split("-")[1]
    const victim_user = (await pool.query(`SELECT * FROM users WHERE id=?`, [id]))[0][0]
    var username
    await client.telegram.getChat(victim_user.userID)
        .then(chat => {
            if (!chat.username) {
                username = chat.first_name + " " + ((chat.last_name) ? chat.last_name : "(no username)")
            } else {
                username = chat.username
            }
        })

    await Context.editMessageText(`<b>Sei sicuro di voler bandire <code>${username} (${victim_user.userID})</code> dall'utilizzo del bot?</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `userban-${victim_user.id}`), Markup.button.callback("❌", `manageuser-${user.id}`)]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action(/^userban-\d{1,}/, async (Context) => {
    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    let id = Context.match[0].split("-")[1]
    pool.query(`UPDATE users SET banned=TRUE WHERE id=?`, [id])

    if (debug) console.warn(`${Date.now()} user banned from bot. victim user key: ${id}, author user key: ${user.id}`)
    await Context.editMessageText(`<b>Utente bandito dal bot!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", `manageuser-${id}`)]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
//#endregion
//#endregion

//#region Azione: trasmetti messaggio
client.action("broadcast", async (Context) => {
    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.editMessageText(`<b>Sei sicuro di voler mandare un messaggio a tutti gli utenti/admin del bot?</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `dobroadcast`), Markup.button.callback("❌", "panel")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action("dobroadcast", async (Context) => {
    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.scene.enter("broadcast")
})
//#endregion

//#region Azione: Config
client.action("config", async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    const Config = (await pool.query("SELECT * FROM config"))[0][0]
    await Context.editMessageText(`Nome attuale: <code>${Config.shopname}</code>\nValuta: <code>${Config.currency}</code>\n\n<b>❓ Cosa vuoi fare</b>`, { parse_mode: 'HTML' })

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.callback("Cambia nome shop", "editshopname")],
            [Markup.button.callback("Cambia valuta", "currency")],
            [Markup.button.callback("Messaggio del Giorno", "motd")],
            [Markup.button.callback("↩️ Indietro", "panel")]
        ]
    })
})
//#region Config: nome shop
client.action("editshopname", async (Context) => {
    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.scene.enter("editshopname")
})
//#endregion
//#region Config: valuta
client.action("currency", async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    const Config = (await pool.query(`SELECT * FROM config`))[0][0]
    await Context.editMessageText(`La valuta corrente è: <code>${Config.currency}</code>\nChe valuta vuoi usare?`, { parse_mode: 'HTML' })

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            /*
            [Markup.button.callback("EUR", "eur"), Markup.button.callback("USD", "usd"), Markup.button.callback("JPY", "jpy"), Markup.button.callback("GBP", "gbp")],
            [Markup.button.callback("AUD", "aud"), Markup.button.callback("CAD", "cad"), Markup.button.callback("CHF", "chf"), Markup.button.callback("CNH", "cnh") ],
            */
            [Markup.button.callback("€", "euro"), Markup.button.callback("$", "dollar"), Markup.button.callback("¥", "yen"), Markup.button.callback("£", "pound")],
            [Markup.button.callback("↩️ Indietro", "panel")]
        ]
    })
})
client.action("euro", async (Context) => {
    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await pool.query(`UPDATE config SET currency='€'`)
    if (debug) console.warn(`${Date.now()} currency changed to euro. author user key ${user.id}`)
    await Context.editMessageText(`<b>Valuta impostata ad euro €!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "currency")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action("dollar", async (Context) => {
    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await pool.query(`UPDATE config SET currency='$'`)
    if (debug) console.warn(`${Date.now()} currency changed to dollar. author user key ${user.id}`)
    await Context.editMessageText(`<b>Valuta impostata a dollari $!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "currency")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action("yen", async (Context) => {
    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await pool.query(`UPDATE config SET currency='¥'`)
    if (debug) console.warn(`${Date.now()} currency changed to yen. author user key ${user.id}`)
    await Context.editMessageText(`<b>Valuta impostata a yen ¥!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "currency")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action("pound", async (Context) => {
    const Users = (await getUsers())[0]

    if (user.banned) return
    if (!user.admin) return
    await pool.query(`UPDATE config SET currency='£'`)
    if (debug) console.warn(`${Date.now()} currency changed to pound. author user key ${user.id}`)
    await Context.editMessageText(`<b>Valuta impostata a sterline £!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "currency")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
//#endregion
//#region Config: MOTD
client.action("motd", async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    const Config = (await pool.query(`SELECT * FROM config`))[0][0]
    await Context.editMessageText(`Il Messaggio del Giorno corrente è: <code>${Config.motd}</code>`, { parse_mode: 'HTML' })

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.callback("Cambia", "editmotd"), Markup.button.callback("Rimuovi", "rmmotd")],
            [Markup.button.callback("↩️ Indietro", "config")]
        ]
    })
})
client.action("editmotd", async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.scene.enter("editmotd")
})
client.action("rmmotd", async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.editMessageText(`<b>Sei sicuro di voler rimuovere il Messaggio del Giorno corrente?</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `motdrm`), Markup.button.callback("❌", "motd")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
})
client.action("motdrm", async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await pool.query(`UPDATE config SET motd=NULL`)
    if (debug) console.warn(`${Date.now()} motd removed. author user key ${user.id}`)
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