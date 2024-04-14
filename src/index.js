const debug = (require('inspector').url()) ? true : false;
const mysql = require('mysql2/promise');

const {
    Telegraf, Markup, Scenes, session
} = require('telegraf')

require('dotenv').config();

const scenes = require("../include/scenes.js");
const main_actions = require("../include/actions/main.js");
const product_actions = require("../include/actions/product.js");


//#region Database Configuration
/* const pool = mysql.createPool({
    connectionLimit: 50,
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPWD,
    database: process.env.DBNAME
}) */
//#endregion

// #region Telegram Bot Configuration
const client = new Telegraf(process.env.TOKEN)
client.catch(async (e) => {
    console.error(e)
    results = await pool.query("SELECT * FROM users WHERE admin=TRUE")
    results.forEach(admin => { client.telegram.sendMessage(admin.userID, `Errore: \`\`\`${e}\`\`\``, { parse_mode: "MarkdownV2" }) })
})

getProducts = async () => {
    return pool.query('SELECT * FROM products')
}

getUsers = async () => {
    return pool.query('SELECT * FROM users')
}
// #endregion

//#region Scenes Configuration
client.use(session());
client.use(new Scenes.Stage([scenes.addProduct, scenes.editName, scenes.editPrice, scenes.editStock, scenes.addAdmin, scenes.editMotd, scenes.setCredit, scenes.addCredit, scenes.rmCredit, scenes.editShopName, scenes.broadcast]));
//#endregion

// #region Start Handler
client.start(async (Context) => {
    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (!user) {
        await pool.query(`INSERT INTO users (userID, balance, admin, banned, pisello) VALUES (?, 0.00, 0, 0, ${Math.floor(Math.random() * 20)})`, [Context.chat.id])
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

// #region Menu Actions
client.action("main", main_actions.main)
client.action("products", main_actions.products)
client.action("account", main_actions.account)
client.action("info", main_actions.info)
client.action("panel", main_actions.panel)
// #endregion

//#region Panel Actions
client.action("addproduct", product_actions.addproduct)

client.action("rmproduct", product_actions.rmproduct)
client.action(/^rmproduct-\d{1,}/, product_actions.rmproductconfirm)
client.action(/^productrm-\d{1,}/, product_actions.productrm)

client.action("editproduct", product_actions.editproduct)
client.action(/^editproduct-\d{1,}/, product_actions.editproductconfirm)

client.action(/^changename-\d{1,}/, product_actions.changename)
client.action(/^changeprice-\d{1,}/, product_actions.changeprice)
client.action(/^changestock-\d{1,}/, product_actions.changestock)
client.action(/^changevis-\d{1,}/, product_actions.changevis)
client.action(/^hide-\d{1,}/, product_actions.hide)
client.action(/^show-\d{1,}/, product_actions.show)
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
    await Context.editMessageText(`<b>Sei sicuro di voler mandare un messaggio a tutti gli utenti e admin del bot?</b>`, { parse_mode: 'HTML' })
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