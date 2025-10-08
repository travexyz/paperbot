const {Markup} = require('telegraf');
const queries = require("../config/database/dbQueries");
const helpers = require("../helpers")
const {getUsername} = require('./userPanel')

const manageadmins = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context.from.id)) return;

    const databaseUsers = await queries.getUsers();

    let message = "<b>👥 Lista amministratori:</b>\n"
    for (const user of databaseUsers) {
        let username = await getUsername(user);
        message += `- <code>${username} (${user.telegram_id})</code>\n`;
    }

    message += "\n<b>‼️ Seleziona un amministratore per gestirlo:</b>"
    await Context.editMessageText(message, {parse_mode: 'HTML'})

    let keyboard = {
        inline_keyboard: []
    }
    for (const user of databaseUsers) {
        let username = await getUsername(user);
        keyboard.inline_keyboard.push([Markup.button.callback(username, `manageuser-${user.id}`)])
    }
    keyboard.inline_keyboard.push([Markup.button.callback("➕ Aggiungi admin da ID", "addadmin")])
    keyboard.inline_keyboard.push([Markup.button.callback("↩️ Indietro", "panel")])

    await Context.editMessageReplyMarkup(keyboard)
}

const addadmin = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context.from.id)) return;

    await Context.editMessageText(`<b>Sei sicuro di voler aggiungere un nuovo amministratore?</b>`, {parse_mode: 'HTML'})
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `adminadd`), Markup.button.callback("❌", "panel")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

const adminadd = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context.from.id)) return;

    await Context.scene.enter("addadmin")
}

const rmadminconfirm = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context.from.id)) return;

    let id = Context.match[0].split("-")[1]
    const target_user = await queries.getUserByDatabaseId(id)

    let username = await getUsername(target_user);

    await Context.editMessageText(`<b>Sei sicuro che vuoi rimuovere <code>${username} (${target_user.telegram_id})</code> dagli amministratori?</b>`, {parse_mode: 'HTML'})
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `adminrm-${target_user.id}`), Markup.button.callback("❌", `manageuser-${target_user.id}`)]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

const adminrm = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context.from.id)) return;

    let id = Context.match[0].split("-")[1]
    await queries.removeAdmin(id, Context.from.id)

    await Context.editMessageText(`<b>Utente rimosso dalla lista degli amministratori!</b>`, {parse_mode: 'HTML'})
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "rmadmin")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

module.exports = {manageadmins, addadmin, adminadd, rmadminconfirm, adminrm}