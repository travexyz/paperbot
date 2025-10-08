const { Markup } = require('telegraf');
const helpers = require("../helpers")
const queries = require('../config/database/dbQueries');

const start = async (Context) => {
    if (!await helpers.hasUserAccess(Context.from.id)) return

    const user = await queries.getUserByTelegramId(Context.from.id);
    if (!user['telegram_id']) {
        await queries.initializeUser(Context.chat.id);
    }

    const settings = await queries.getSettings();

    Context.reply(`*${settings.shop_name} Bot — Creato da ||travexyz||*`, {
        parse_mode: "MarkdownV2",
        ...Markup.inlineKeyboard([[Markup.button.callback("👽 Entra", "main")]])
    });
};

const main = async (Context) => {
    if (!await helpers.hasUserAccess(Context.from.id)) return

    const settings = await queries.getSettings();

    await Context.editMessageText(`😎 Ciao <b>${(Context.from.username) ? Context.from.username : Context.from.first_name}</b>, benvenuto in <b>${settings['shop_name']}</b>!\n\n${(settings['motd'] !== null) ? `<code>${settings['motd']}</code>` : `${new Date().toLocaleDateString()}`}`, { parse_mode: 'HTML' });

    let keyboard = {
        inline_keyboard: [
            [Markup.button.callback("📚 Prodotti", "product")],
            [Markup.button.callback("🪪 Account", "account"), Markup.button.callback("ℹ️ Info", "info")],
        ],
    }

    if (await await helpers.hasAdministratorAccess(Context.from.id))
        keyboard.inline_keyboard.push([Markup.button.callback("🛠️ Pannello Amministratori", "panel")])

    await Context.editMessageReplyMarkup(keyboard);
};

const product = async (Context) => {
    if (!await helpers.hasUserAccess(Context.from.id)) return

    const user = await queries.getUserByTelegramId(Context.from.id);
    const settings = await queries.getSettings();

    let message = `📚 <b>Prodotti di ${settings['shop_name']}\n</b>💰 <b>Saldo:</b> <code>${user.balance}${settings.currency}</code>\n\n`;

    const products = await queries.getProducts();
    for (const item of products) {
        if (item.hidden && !user['is_admin']) continue;

        let stock = item.stock;
        if (stock === 0)
            stock = "SOLD OUT";
        else if (stock === -1)
            stock = "UNLIMITED";

        if (item['is_visible'] || user['is_admin'])
            message += `<b>‼️ ${item.name}</b>\n💸 Prezzo: <code>${item.price}${settings.currency}</code>\n🎰 Stock: <code>${stock}</code>\n`;

        if (user['is_admin'])
            message += (item['is_visible']) ? "<b>🔓 Visibile agli utenti</b>\n\n" : "<b>🔒 Non visibile agli utenti</b>\n\n"
    }

    await Context.editMessageText(message, { parse_mode: 'HTML' });
    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.url("💫 Acquista", "tg://user?id=304506948"), Markup.button.callback("↩️ Indietro", "main")]
        ]
    });
};

const account = async (Context) => {
    if (!await helpers.hasUserAccess(Context.from.id)) return

    const user = await queries.getUserByTelegramId(Context.from.id);

    const settings = await queries.getSettings();
    await Context.editMessageText(`${(user['is_admin']) ? "🔱 <b>Amministratore</b>\n" : ""}👤 <b>Username</b> <code>${(Context.chat.username) ? Context.from.username : "N/A"}</code>
🆔 <b>ID:</b> <code>${Context.chat.id}</code>
💵 <b>Saldo:</b> <code>${user.balance}${settings.currency}</code>
📏 <b>Pisello:</b> <code>${user['pisello_length']}cm ${(user['pisello_length'] > 15) ? "😱" : "😮‍💨"}</code>`, { parse_mode: 'HTML' });

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "main")]
        ]
    });
};

const info = async (Context) => {
    if (!await helpers.hasUserAccess(Context.from.id)) return

    await Context.editMessageText("*🤖 Creato da ||travexyz|| con ||❤️||*", { parse_mode: 'MarkdownV2' });
    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.url("Contatta Sviluppatore", "tg://user?id=304506948")],
            [Markup.button.callback("↩️ Indietro", "main")]
        ]
    });
};

const panel = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context.from.id)) return;

    await Context.editMessageText(`<b>🛠️ Pannello Amministratori</b>`, { parse_mode: 'HTML' });
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("➕ Aggiungi prodotto", "addproduct"), Markup.button.callback("❌ Rimuovi prodotto", "rmproduct")],
            [Markup.button.callback("✍️ Modifica prodotto", "editproduct")],
            [Markup.button.callback("👥 Gestisci utenti", "manageusers")],
            [Markup.button.callback("📣 Trasmetti messaggio", "broadcast")],
            [Markup.button.callback("🧑‍⚖️ Gestisci admin", "manageadmins")],
            [Markup.button.callback("📝 Configurazione bot", "settings")],
            [Markup.button.callback("↩️ Indietro", "main")]
        ]
    };

    await Context.editMessageReplyMarkup(markup);
};

module.exports = { start, main, product, account, info, panel };