// File: include/actions/admin.js
// Description: File contenente le azioni per la gestione admin nel bot
// Date: 14/04/2024

const { Markup } = require('telegraf');
const client = require("../client.js");
const pool = require("../db.js");

const debug = true // DA AGGIORNARE

const addadmin = async (Context) => {

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
}

const adminadd = async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.scene.enter("addadmin")
}

const rmadmin = async (Context) => {

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
}

const rmadminconfirm = async (Context) => {
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
}

const adminrm = async (Context) => {
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
}

module.exports = { addadmin, adminadd, rmadmin, rmadminconfirm, adminrm }