const {Markup} = require('telegraf');
const helpers = require("../helpers")
const queries = require('../config/database/dbQueries');

const start = async (Context) => {
    if (!await helpers.hasUserAccess(Context)) return
    
    const user = await queries.getUserByTelegramId(Context.from.id);
    if (!user) {
        await queries.initializeUser(Context.chat.id);
    } else if (user.banned) return;

    const config = await queries.getConfig(Context.from.id);

    Context.reply(`*${config.shopname} Bot — Creato da ||travexyz||*`, {
        parse_mode: "MarkdownV2",
        ...Markup.inlineKeyboard([[Markup.button.callback("👽 Entra", "main")]])
    });
};

const main = async (Context) => {
    if (!await helpers.hasUserAccess(Context)) return

    const config = await queries.getConfig(Context.from.id);

    await Context.editMessageText(`😎 Ciao <b>${(Context.from.username) ? Context.from.username : Context.from.first_name}</b>, benvenuto in <b>${config.shopname}</b>!\n\n${(config.motd !== null) ? `<code>${config.motd}</code>` : `${new Date().toLocaleDateString()}`}`, {parse_mode: 'HTML'});

    let keyboard = {
        inline_keyboard: [
            [Markup.button.callback("📚 Prodotti", "products")],
            [Markup.button.callback("🪪 Account", "account"), Markup.button.callback("ℹ️ Info", "info")],
        ],
    }

    if (await await helpers.hasAdministratorAccess(Context))
        keyboard.inline_keyboard.push([Markup.button.callback("🛠️ Pannello Amministratori", "panel")])

    await Context.editMessageReplyMarkup(keyboard);
};

const products = async (Context) => {
    if (!await helpers.hasUserAccess(Context)) return

    const user = await queries.getUserByTelegramId(Context.from.id);
    const config = await queries.getConfig(Context.from.id);

    let message = `📚 <b>Prodotti di ${config.shopname}\n</b>💰 <b>Grana:</b> <code>${user.balance}${config.currency}</code>\n\n`;

    const Products = await queries.getProducts(Context.from.id);
    for (const item of Products) {
        if (item.hidden && !user.admin) continue;

        let stock = item.stock;
        if (stock === 0)
            stock = "SOLD OUT";
        else if (stock === -1)
            stock = "UNLIMITED";

        message += `<b>‼️ ${item.name}</b>\n💸 Prezzo: <code>${item.price}${config.currency}</code>\n🎰 Stock: <code>${stock}</code>\n`;
        if (user.admin)
            message += (item.visible) ? "<b>🔓 Visibile</b>\n\n" : "<b>🔒 Non visibile</b>\n\n"
    }

    await Context.editMessageText(message, {parse_mode: 'HTML'});
    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.url("💫 Acquista", "tg://user?id=304506948"), Markup.button.callback("↩️ Indietro", "main")]
        ]
    });
};

const account = async (Context) => {
    if (!await helpers.hasUserAccess(Context)) return

    const user = await queries.getUserByTelegramId(Context.from.id);

    const config = await queries.getConfig(Context.from.id);
    await Context.editMessageText(`${(user.admin) ? "🔱 <b>Amministratore</b>\n" : ""}👤 <b>Username</b> <code>${(Context.chat.username) ? Context.from.username : "N/A"}</code>
🆔 <b>ID:</b> <code>${Context.chat.id}</code>
💵 <b>Grana:</b> <code>${user.balance}${config.currency}</code>
📏 <b>Pisello:</b> <code>${user.pisello}cm ${(user.pisello > 10) ? "😱" : "😮‍💨"}</code>`, {parse_mode: 'HTML'});

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "main")]
        ]
    });
};

const info = async (Context) => {
    if (!await helpers.hasUserAccess(Context)) return

    await Context.editMessageText("*🤖 Creato da ||travexyz|| con ||❤️||*", {parse_mode: 'MarkdownV2'});
    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.url("Contatta Sviluppatore", "tg://user?id=304506948")],
            [Markup.button.callback("↩️ Indietro", "main")]
        ]
    });
};

const panel = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context)) return;

    await Context.editMessageText(`<b>🛠️ Pannello Amministratori</b>`, {parse_mode: 'HTML'});
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("➕ Aggiungi prodotto", "addproduct"), Markup.button.callback("❌ Rimuovi prodotto", "rmproduct")],
            [Markup.button.callback("✍️ Modifica prodotto", "editproduct")],
            [Markup.button.callback("👥 Gestisci utenti", "manageusers")],
            [Markup.button.callback("📣 Trasmetti messaggio", "broadcast")],
            [Markup.button.callback("🧑‍⚖️ Gestisci admin", "manageadmins")],
            [Markup.button.callback("📝 Configurazione bot", "config")],
            [Markup.button.callback("↩️ Indietro", "main")]
        ]
    };

    await Context.editMessageReplyMarkup(markup);
};

module.exports = {start, main, products, account, info, panel};