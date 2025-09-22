const {Markup} = require('telegraf');
const pool = require("../config/database/dbConfig");
const helpers = require("../helpers")
const queries = require("../config/database/dbQueries");

const motd = async (Context) => {
    if (!helpers.hasPassedAdminChecks()) return;

    const Config = queries.getConfig()

    await Context.editMessageText(`Il Messaggio del Giorno corrente è: <code>${Config.motd}</code>`, {parse_mode: 'HTML'});
    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.callback("Cambia", "editmotd"), Markup.button.callback("Rimuovi", "rmmotd")],
            [Markup.button.callback("↩️ Indietro", "config")]
        ]
    });
}

const editmotd = async (Context) => {
    if (!helpers.hasPassedAdminChecks()) return;

    await Context.scene.enter("editmotd");
}

const rmmotd = async (Context) => {
    if (!helpers.hasPassedAdminChecks()) return;

    await Context.editMessageText(`<b>Sei sicuro di voler rimuovere il Messaggio del Giorno corrente?</b>`, {parse_mode: 'HTML'});
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `motdrm`), Markup.button.callback("❌", "motd")]
        ]
    }
    await Context.editMessageReplyMarkup(markup);
}

const motdrm = async (Context) => {
    if (!helpers.hasPassedAdminChecks()) return;

    await pool.query(`UPDATE config
                      SET motd=NULL`);
    // logger warn missing

    await Context.editMessageText(`<b>MOTD rimosso!</b>`, {parse_mode: 'HTML'});
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "motd")]
        ]
    }
    await Context.editMessageReplyMarkup(markup);
}

module.exports = {motd, editmotd, rmmotd, motdrm}