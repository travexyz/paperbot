// File: include/main.js
// Descrizione: File contenente le azioni del pannello principale del bot
// Autore: travexyz
// Data: 14/04/2024

const Markup = require('telegraf')

const main = async (Context) => {

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

}

const products = async (Context) => {

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
}

const account = async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return

    const Config = (await pool.query(`SELECT * FROM config`))[0][0]
    await Context.editMessageText(`👤 <b>Username</b> <code>${Context.chat.username}</code>${(user.admin) ? " <i>amministratore</i>" : ""}
🆔 <b>ID:</b> <code>${Context.chat.id}</code>
💵 <b>Grana:</b> <code>${user.balance}${Config.currency}</code>
📏 <b>Pisello:</b> <code>${user.pisello}cm ${(user.pisello > 10) ? "😱" : "😮‍💨"}</code>`, { parse_mode: 'HTML' })

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "main")]
        ]
    })
}

const info = async (Context) => {

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
}

const panel = async (Context) => {

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
}

module.exports = { main, products, account, info, panel }