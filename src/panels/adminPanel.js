const { Markup } = require('telegraf');
const client = require("../config/clientConfig");
const queries = require("../config/database/dbQueries");

const getUsername = async (user) => {
    let username;
    await client.telegram.getChat(user.telegramID)
        .then(chat => {
            if (!chat.username) {
                username = chat.first_name + " " + ((chat.last_name) ? chat.last_name : "(no username)");
            } else {
                username = chat.username;
            }
        });
    return username;
}

const manageadmins = async (Context) => {
    const Users = await queries.getUsers(Context.from.username);
    const user = Users.find(user => user.telegramID === Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let message = "<b>👥 Lista amministratori:</b>\n"
    for (const user of Users) {
        let username = await getUsername(user);
        message += `- <code>${username} (${user.telegramID})</code>\n`;
    }

    message += "\n<b>‼️ Seleziona un amministratore per gestirlo:</b>"
    await Context.editMessageText(message, { parse_mode: 'HTML' })

    let keyboard = {
        inline_keyboard: []
    }
    for (const user of Users) {
        let username = await getUsername(user);
        keyboard.inline_keyboard.push([Markup.button.callback(username, `manageuser-${user.id}`)])
    }
    keyboard.inline_keyboard.push([Markup.button.callback("➕ Aggiungi admin da ID", "addadmin")])
    keyboard.inline_keyboard.push([Markup.button.callback("↩️ Indietro", "panel")])

    await Context.editMessageReplyMarkup(keyboard)
}

const addadmin = async (Context) => {

    const Users = await queries.getUsers(Context.from.id)
    const user = Users.find(user => user.telegramID === Context.chat.id)
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

    const Users = await queries.getUsers(Context.from.id)
    const user = Users.find(user => user.telegramID === Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.scene.enter("addadmin")
}

const rmadminconfirm = async (Context) => {
    const Users = await queries.getUsers(Context.from.id)
    const user = Users.find(user => user.telegramID === Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]
    const target_user = await queries.getUserById(id, Context.from.username)

    let username = await getUsername(target_user);

    await Context.editMessageText(`<b>Sei sicuro che vuoi rimuovere <code>${username} (${target_user.telegramID})</code> dagli amministratori?</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `adminrm-${target_user.id}`), Markup.button.callback("❌", `manageuser-${target_user.id}`)]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

const adminrm = async (Context) => {
    const Users = await queries.getUsers(Context.from.id)
    const user = Users.find(user => user.telegramID === Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]

    await queries.removeAdmin(id)

    await Context.editMessageText(`<b>Utente rimosso dalla lista degli amministratori!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "rmadmin")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

module.exports = { manageadmins, addadmin, adminadd, rmadminconfirm, adminrm }