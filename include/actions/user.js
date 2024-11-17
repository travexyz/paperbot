// File: include/actions/user.js
// Description: File contenente le azioni per la gestione utenti nel bot
// Data: 14/04/2024

const { Markup } = require('telegraf');
const client = require("../../src/client.js");
const pool = require("../../src/db.js");
const queries = require("../../src/queries.js");

const debug = true // DA AGGIORNARE

const manageusers = async Context => {
    const Users = await queries.getUsers()
    const user = Users.find(usr => usr.telegramID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let message = "<b>👥 Utenti Salvati:</b>\n"
    Users.forEach(async user => {
        message += `- <code>${user.telegramID}</code>${(user.admin) ? ": amministratore\n" : ": utente\n"}`
    })
    message += "\n<b>‼️ Seleziona un utente per gestirlo:</b>"
    await Context.editMessageText(message, { parse_mode: 'HTML' })

    let keyboard = []
    Users.forEach(async (usr) => {
        keyboard.push([Markup.button.callback(usr.telegramID, `manageuser-${usr.id}`)])
    })
    keyboard.push([Markup.button.callback("↩️ Indietro", "panel")])
    let markup = {
        inline_keyboard: keyboard
    }
    await Context.editMessageReplyMarkup(markup)
}

const manageuser = async (Context) => {

    const Users = await queries.getUsers()
    const user = Users.find(usr => usr.telegramID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    const Config = await queries.getConfig();
    var id = Context.match[0].split("-")[1];
    const victim_user = await queries.getUserById(id);

    var username;
    await client.telegram.getChat(victim_user.telegramID)
        .then(chat => {
            if (!chat.username) {
                username = chat.first_name + " " + ((chat.last_name) ? chat.last_name : "(no username)");
            } else {
                username = chat.username;
            }
        });

    await Context.editMessageText(`<b>‼️ Utente</b> <code>${username}</code>\nID: <code>${victim_user.telegramID}</code>\n💵 <b>Grana:</b> <code>${victim_user.balance}${Config.currency}</code>\n🛠️ <b>Amministratore:</b> <code>${(victim_user.admin) ? "Yes" : "No"}</code>`, { parse_mode: 'HTML' });
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("Imposta Credito", `setcredit-${victim_user.id}`), Markup.button.callback("Aggiungi Credito", `addcredit-${victim_user.id}`), Markup.button.callback("Rimuovi Credito", `rmcredit-${victim_user.id}`)],
            [Markup.button.callback("Bandisci", `banuser-${victim_user.id}`)],
            [Markup.button.callback("↩️ Indietro", "manageusers")]
        ]
    };
    await Context.editMessageReplyMarkup(markup);
}

const setcredit = async (Context) => {
    const Users = await queries.getUsers()
    const user = Users.find(usr => usr.telegramID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("setcredit", { id: id })
}

const addcredit = async (Context) => {
    const Users = await queries.getUsers()
    const user = Users.find(usr => usr.telegramID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("addcredit", { id: id })
}

const rmcredit = async (Context) => {
    const Users = await queries.getUsers()
    const user = Users.find(usr => usr.telegramID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("rmcredit", { id: id })
}

const banuser = async (Context) => {
    const Users = await queries.getUsers()
    const user = Users.find(usr => usr.telegramID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1];
    const victim_user = await queries.getUserById(id);
    var username;
    await client.telegram.getChat(victim_user.telegramID)
        .then(chat => {
            if (!chat.username) {
                username = chat.first_name + " " + ((chat.last_name) ? chat.last_name : "(no username)");
            } else {
                username = chat.username;
            }
        });

    await Context.editMessageText(`<b>Sei sicuro di voler bandire <code>${username} (${victim_user.telegramID})</code> dall'utilizzo del bot?</b>`, { parse_mode: 'HTML' });
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `userban-${victim_user.id}`), Markup.button.callback("❌", `manageuser-${user.id}`)]
        ]
    };
    await Context.editMessageReplyMarkup(markup);
}

const userban = async (Context) => {
    const Users = await queries.getUsers()
    const user = Users.find(usr => usr.telegramID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    
    let id = Context.match[0].split("-")[1];
    await queries.banUser(id);

    if (debug) console.warn(`${Date.now()} user banned from bot. victim user key: ${id}, author user key: ${user.id}`);
    await Context.editMessageText(`<b>Utente bandito dal bot!</b>`, { parse_mode: 'HTML' });
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", `manageuser-${id}`)]
        ]
    };
    await Context.editMessageReplyMarkup(markup);
}

module.exports = { manageusers, manageuser, setcredit, addcredit, rmcredit, banuser, userban }