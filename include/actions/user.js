// File: include/actions/user.js
// Description: File contenente le azioni per la gestione utenti nel bot
// Data: 14/04/2024

const { Markup } = require('telegraf');
const client = require("../../src/client.js");
const queries = require("../../src/queries.js");

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

const manageusers = async Context => {
    const Users = await queries.getUsers(Context.from.username);
    const user = Users.find(user => user.telegramID === Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let message = "<b>👥 Lista utenti:</b>\n"
    for (const user of Users) {
        let username = await getUsername(user)
        message += `- <code>${username} (${user.telegramID})</code>\n`
    }
    message += "\n<b>‼️ Seleziona un utente per gestirlo:</b>"

    await Context.editMessageText(message, { parse_mode: 'HTML' })

    let keyboard = []
    for (const user of Users) {
        let username = await getUsername(user)
        keyboard.push([Markup.button.callback(username, `manageuser-${user.id}`)])
    }

    keyboard.push([Markup.button.callback("↩️ Indietro", "panel")])
    let markup = {
        inline_keyboard: keyboard
    }

    await Context.editMessageReplyMarkup(markup)
}

const manageuser = async (Context) => {
    const Users = await queries.getUsers(Context.from.username);
    const user = Users.find(user => user.telegramID === Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    const Config = await queries.getConfig(Context.from.username);
    var id = Context.match[0].split("-")[1];
    const target_user = await queries.getUserById(id, Context.from.username);

    let username = await getUsername(user)

    await Context.editMessageText(`<b>‼️ Utente ${(user.admin) ? "amministratore" : ""}</b>\n🪪 <b>Username:</b> <code>${username}</code>\n🆔 ID: <code>${target_user.telegramID}</code>\n💵 <b>Grana:</b> <code>${target_user.balance}${Config.currency}</code>\n🛠️ <b>Amministratore:</b> <code>${(target_user.admin) ? "Yes" : "No"}</code>\n\nNel database da: <code>${target_user.created_at.toISOString()}</code>\n\nUltimo aggiornamento: <code>${target_user.updated_at.toISOString()}</code>\n`, { parse_mode: 'HTML' });
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("Set Credit", `setcredit-${target_user.id}`), Markup.button.callback("Add Credit", `addcredit-${target_user.id}`), Markup.button.callback("Remove Credit", `rmcredit-${target_user.id}`)],
            (user.admin) ? [Markup.button.callback("❌ Rimuovi amministratore", `rmadmin-${target_user.id}`)] : [Markup.button.callback("➕ Rendi amministratore", `addadmin-${target_user.id}`)],
            [Markup.button.callback("⛔ Bandisci", `banuser-${target_user.id}`)],
            [Markup.button.callback("↩️ Indietro", "manageusers")]
        ]
    };
    await Context.editMessageReplyMarkup(markup);
}

const setcredit = async (Context) => {
    const Users = await queries.getUsers(Context.from.username);
    const user = Users.find(user => user.telegramID === Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("setcredit", { id: id })
}

const addcredit = async (Context) => {
    const Users = await queries.getUsers(Context.from.username);
    const user = Users.find(user => user.telegramID === Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("addcredit", { id: id })
}

const rmcredit = async (Context) => {
    const Users = await queries.getUsers(Context.from.username);
    const user = Users.find(user => user.telegramID === Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("rmcredit", { id: id })
}

const banuser = async (Context) => {
    const Users = await queries.getUsers(Context.from.username);
    const user = Users.find(user => user.telegramID === Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1];
    const target_user = await queries.getUserById(id, Context.from.username);

    let username = await getUsername(user)

    await Context.editMessageText(`<b>Sei sicuro di voler bandire <code>${username} (${target_user.telegramID})</code> dall'utilizzo del bot?</b>`, { parse_mode: 'HTML' });
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `userban-${target_user.id}`), Markup.button.callback("❌", `manageuser-${user.id}`)]
        ]
    };
    await Context.editMessageReplyMarkup(markup);
}

const userban = async (Context) => {
    const Users = await queries.getUsers(Context.from.username);
    const user = Users.find(user => user.telegramID === Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1];
    await queries.banUser(id, Context.from.username);

    await Context.editMessageText(`<b>Utente bandito dal bot!</b>`, { parse_mode: 'HTML' });
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", `manageuser-${id}`)]
        ]
    };
    await Context.editMessageReplyMarkup(markup);
}

module.exports = { manageusers, manageuser, setcredit, addcredit, rmcredit, banuser, userban }