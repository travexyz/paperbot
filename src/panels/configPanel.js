const {Markup} = require('telegraf');
const queries = require("../config/database/dbQueries");

const broadcast = async (Context) => {
    const user = await queries.getUserByTelegramId(Context.from.id);
    if (user.banned) return;
    if (!user.admin) return;

    await Context.editMessageText(`<b>Sei sicuro di voler mandare un messaggio a tutti gli utenti e admin del bot?</b>`, {parse_mode: 'HTML'});
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `dobroadcast`), Markup.button.callback("❌", "panel")]
        ]
    };

    await Context.editMessageReplyMarkup(markup);
}

const dobroadcast = async (Context) => {
    const user = await queries.getUserByTelegramId(Context.from.id);
    if (user.banned) return;
    if (!user.admin) return;

    await Context.scene.enter("broadcast");
}

const config = async (Context) => {
    const user = await queries.getUserByTelegramId(Context.from.id);
    if (user.banned) return;
    if (!user.admin) return;

    const config = await queries.getConfig(Context.from.id);

    await Context.editMessageText(`Nome attuale: <code>${config.shopname}</code>\nValuta: <code>${config.currency}</code>\n\n<b>❓ Cosa vuoi fare</b>`, {parse_mode: 'HTML'});
    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.callback("Cambia nome shop", "editshopname")],
            [Markup.button.callback("Cambia valuta", "currency")],
            [Markup.button.callback("Messaggio del Giorno", "motd")],
            [Markup.button.callback("↩️ Indietro", "panel")]
        ]
    });
}

const editshopname = async (Context) => {
    const user = await queries.getUserByTelegramId(Context.from.id);
    if (user.banned) return;
    if (!user.admin) return;

    await Context.scene.enter("editshopname");
}

const currency = async (Context) => {
    const user = await queries.getUserByTelegramId(Context.from.id);
    if (user.banned) return;
    if (!user.admin) return;

    const config = await queries.getConfig();
    await Context.editMessageText(`La valuta corrente è: <code>${config.currency}</code>\nChe valuta vuoi usare?`, {parse_mode: 'HTML'});

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.callback("€", "euro"), Markup.button.callback("$", "dollar"), Markup.button.callback("¥", "yen"), Markup.button.callback("£", "pound")],
            [Markup.button.callback("↩️ Indietro", "panel")]
        ]
    });
}

const euro = async (Context) => {
    const user = await queries.getUserByTelegramId(Context.from.id);
    if (user.banned) return;
    if (!user.admin) return;
    await queries.updateCurrency('€', Context.from.username);

    await Context.editMessageText(`<b>Valuta impostata ad euro €!</b>`, {parse_mode: 'HTML'});
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "currency")]
        ]
    };
    await Context.editMessageReplyMarkup(markup);
}

const dollar = async (Context) => {
    const user = await queries.getUserByTelegramId(Context.from.id);
    if (user.banned) return;
    if (!user.admin) return;

    await queries.updateCurrency('$', Context.from.username);

    await Context.editMessageText(`<b>Valuta impostata a dollari $!</b>`, {parse_mode: 'HTML'});
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "currency")]
        ]
    };
    await Context.editMessageReplyMarkup(markup);
}

const yen = async (Context) => {
    const user = await queries.getUserByTelegramId(Context.from.id);
    if (user.banned) return;
    if (!user.admin) return;

    await queries.updateCurrency('¥', Context.from.username);

    await Context.editMessageText(`<b>Valuta impostata a yen ¥!</b>`, {parse_mode: 'HTML'});
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "currency")]
        ]
    };
    await Context.editMessageReplyMarkup(markup);
}

const pound = async (Context) => {
    const user = await queries.getUserByTelegramId(Context.from.id);
    if (user.banned) return;
    if (!user.admin) return;

    await queries.updateCurrency('£', Context.from.username);

    await Context.editMessageText(`<b>Valuta impostata a sterline £!</b>`, {parse_mode: 'HTML'});
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "currency")]
        ]
    };
    await Context.editMessageReplyMarkup(markup);
}

module.exports = {broadcast, dobroadcast, config, editshopname, currency, euro, dollar, yen, pound}