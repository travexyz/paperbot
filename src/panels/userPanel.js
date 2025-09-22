const {Markup} = require('telegraf');
const client = require("../config/clientConfig");
const helpers = require("../helpers")
const queries = require("../config/database/dbQueries");

const getUsername = async (user) => {
    var username;
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
    if (!helpers.hasPassedAdminChecks()) return;

    const databaseUsers = await queries.getUsers();

    let message = "<b>👥 Lista utenti:</b>\n"
    for (const user of databaseUsers) {
        let username = await getUsername(user)
        message += `- <code>${username} (${user.telegramID})</code>\n`
    }
    message += "\n<b>‼️ Seleziona un utente per gestirlo:</b>"

    await Context.editMessageText(message, {parse_mode: 'HTML'})

    let keyboard = []
    for (const user of databaseUsers) {
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
    if (!helpers.hasPassedAdminChecks()) return;

    const Config = await queries.getConfig(Context.from.username);
    const id = Context.match[0].split("-")[1];

    const target_user = await queries.getUserById(id, Context.from.username);
    const target_username = await getUsername(target_user);

    await Context.editMessageText(`<b>‼️ Utente ${(user.admin) ? "amministratore" : ""}</b>\n🪪 <b>Username:</b> <code>${target_username}</code>\n🆔 ID: <code>${target_user.telegramID}</code>\n💵 <b>Grana:</b> <code>${target_user.balance}${Config.currency}</code>\n🛠️ <b>Amministratore:</b> <code>${(target_user.admin) ? "Yes" : "No"}</code>\n\n📜 <b>Dati Database</b>\n<b>➕ Data inserimento:</b> <code>${target_user.created_at.toISOString()}</code>\n<b>🔄 Ultimo aggiornamento:</b>\n<code>${target_user.updated_at.toISOString()}</code>\n`, {parse_mode: 'HTML'});
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("Set Credit", `setcredit-${target_user.id}`), Markup.button.callback("Add Credit", `addcredit-${target_user.id}`), Markup.button.callback("Remove Credit", `rmcredit-${target_user.id}`)],
            (user.admin) ? [Markup.button.callback("❌ Rimuovi amministratore", `rmadmin-${target_user.id}`)] : [Markup.button.callback("➕ Rendi amministratore", `addadmin-${target_user.id}`)],
            (user.banned) ? [Markup.button.callback("✅ Riammetti", `rmban-${target_user.id}`)] : [Markup.button.callback("⛔ Bandisci", `banuser-${target_user.id}`)],
            [Markup.button.callback("↩️ Indietro", "manageusers")]
        ]
    };
    await Context.editMessageReplyMarkup(markup);
}

const setcredit = async (Context) => {
    if (!helpers.hasPassedAdminChecks()) return;

    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("setcredit", {id: id})
}

const addcredit = async (Context) => {
    if (!helpers.hasPassedAdminChecks()) return;

    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("addcredit", {id: id})
}

const rmcredit = async (Context) => {
    if (!helpers.hasPassedAdminChecks()) return;

    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("rmcredit", {id: id})
}

const banuser = async (Context) => {
    if (!helpers.hasPassedAdminChecks()) return;

    let id = Context.match[0].split("-")[1];
    const target_user = await queries.getUserById(id, Context.from.username);

    let username = await getUsername(user)

    await Context.editMessageText(`<b>Sei sicuro di voler bandire <code>${username} (${target_user.telegramID})</code> dall'utilizzo del bot?</b>`, {parse_mode: 'HTML'});
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `userban-${target_user.id}`), Markup.button.callback("❌", `manageuser-${user.id}`)]
        ]
    };

    await Context.editMessageReplyMarkup(markup);
}

const userban = async (Context) => {
    if (!helpers.hasPassedAdminChecks()) return;

    let id = Context.match[0].split("-")[1];
    await queries.banUser(id, Context.from.username);

    await Context.editMessageText(`<b>Utente bandito dal bot!</b>`, {parse_mode: 'HTML'});
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", `manageuser-${id}`)]
        ]
    };

    await Context.editMessageReplyMarkup(markup);
}

const rmban = async (Context) => {
    if (!helpers.hasPassedAdminChecks()) return;

    let id = Context.match[0].split("-")[1];
    const target_user = await queries.getUserById(id, Context.from.username);

    let username = await getUsername(user)

    await Context.editMessageText(`<b>Sei sicuro di voler riammetere <code>${username} (${target_user.telegramID})</code> nel bot?</b>`, {parse_mode: 'HTML'});
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `banrm-${target_user.id}`), Markup.button.callback("❌", `manageuser-${user.id}`)]
        ]
    };

    await Context.editMessageReplyMarkup(markup);
}

const banrm = async (Context) => {
    if (!helpers.hasPassedAdminChecks()) return;

    let id = Context.match[0].split("-")[1];
    await queries.unbanUser(id, Context.from.username);

    await Context.editMessageText(`<b>Utente riammesso nel bot!</b>`, {parse_mode: 'HTML'});
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", `manageuser-${id}`)]
        ]
    };

    await Context.editMessageReplyMarkup(markup);
}

module.exports = {getUsername, manageusers, manageuser, setcredit, addcredit, rmcredit, banuser, userban, rmban, banrm}