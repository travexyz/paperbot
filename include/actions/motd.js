// File: include/actions/motd.js
// Desc: Azioni per il message of the day
// Data: 15/04/2024

const { Markup } = require('telegraf');
const pool = require("../../src/db.js");
const queries = require("../../src/queries.js");

const debug = true // DA AGGIORNARE

const motd = async (Context) => {
    const Users = await queries.getUsers();
    const user = Users.find(user => user.telegramID === Context.chat.id);
    if (user.banned) return;
    if (!user.admin) return;
    const Config = (await pool.query(`SELECT * FROM config`))[0][0];
    await Context.editMessageText(`Il Messaggio del Giorno corrente è: <code>${Config.motd}</code>`, { parse_mode: 'HTML' });

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.callback("Cambia", "editmotd"), Markup.button.callback("Rimuovi", "rmmotd")],
            [Markup.button.callback("↩️ Indietro", "config")]
        ]
    });
}

const editmotd = async (Context) => {
    const Users = await queries.getUsers();
    const user = Users.find(user => user.telegramID === Context.chat.id);
    if (user.banned) return;
    if (!user.admin) return;
    await Context.scene.enter("editmotd");
}

const rmmotd = async (Context) => {
    const Users = await queries.getUsers();
    const user = Users.find(user => user.telegramID === Context.chat.id);
    if (user.banned) return;
    if (!user.admin) return;
    await Context.editMessageText(`<b>Sei sicuro di voler rimuovere il Messaggio del Giorno corrente?</b>`, { parse_mode: 'HTML' });
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `motdrm`), Markup.button.callback("❌", "motd")]
        ]
    }
    await Context.editMessageReplyMarkup(markup);
}

const motdrm = async (Context) => {
    const Users = await queries.getUsers();
    const user = Users.find(user => user.telegramID === Context.chat.id);
    if (user.banned) return;
    if (!user.admin) return;
    
    await pool.query(`UPDATE config SET motd=NULL`);

    await Context.editMessageText(`<b>MOTD rimosso!</b>`, { parse_mode: 'HTML' });
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "motd")]
        ]
    }
    await Context.editMessageReplyMarkup(markup);
}

module.exports = { motd, editmotd, rmmotd, motdrm }