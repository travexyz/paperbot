//#region Initial configuration
const debug = true //(require('inspector').url()) ? true : false;

const {
    Telegraf, Markup, Scenes, session
} = require('telegraf')

require('dotenv').config();

// Loading modules from /include
const scenes = require("../include/scenes.js");
const main_actions = require("../include/actions/main.js");
const product_actions = require("../include/actions/product.js");
const admin_actions = require("../include/actions/admin.js");
const user_actions = require("../include/actions/user.js");

// Configuring database
const pool = require('../include/db.js');

// Configuring bot client and error handling
const client = require('../include/client.js');

// Creating async functions for db queries
getProducts = async () => {
    return pool.query('SELECT * FROM products')
}
getUsers = async () => {
    return pool.query('SELECT * FROM users')
}

// Confiugring wizards (scenes)
client.use(session());
client.use(new Scenes.Stage([scenes.addProduct, scenes.editName, scenes.editPrice, scenes.editStock, scenes.addAdmin, scenes.editMotd, scenes.setCredit, scenes.addCredit, scenes.rmCredit, scenes.editShopName, scenes.broadcast]));
//#endregion

// #region Registering action callbacks
// Azione comando start
client.start(main_actions.start)

// Azioni pannello principale
client.action("main", main_actions.main)
client.action("products", main_actions.products)
client.action("account", main_actions.account)
client.action("info", main_actions.info)
client.action("panel", main_actions.panel)

// Azioni prodotti
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


// Azioni gestione amministratori
client.action("addadmin", admin_actions.addadmin)
client.action("adminadd", admin_actions.adminadd)
client.action("rmadmin", admin_actions.rmadmin)
client.action(/^rmadmin-\d{1,}/, admin_actions.rmadminconfirm)
client.action(/^adminrm-\d{1,}/, admin_actions.adminrm) 

// Azioni gestione utenti
client.action("manageusers", user_actions.manageusers)
client.action(/^manageuser-\d{1,}/, user_actions.manageuser)

client.action(/^setcredit-\d{1,}/, user_actions.setcredit)
client.action(/^addcredit-\d{1,}/, user_actions.addcredit)
client.action(/^rmcredit-\d{1,}/, user_actions.rmcredit)
client.action(/^banuser-\d{1,}/, user_actions.banuser)
client.action(/^userban-\d{1,}/, user_actions.userban)


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
//#endregion

// #region Launching
client.launch({
    dropPendingUpdates: true
})
process.once("SIGINT", () => client.stop("SIGINT"))
process.once("SIGTERM", () => client.stop("SIGTERM"))
// #endregion