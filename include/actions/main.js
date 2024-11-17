const { Markup } = require('telegraf');
const queries = require('../../src/queries.js');

const start = async (Context) => {
    const Users = await queries.getUsers();
    const user = Users.find(usr => usr.telegramID === Context.chat.id);

    if (!user) {
        await queries.initializeUser(Context.chat.id);
    } else if (user.banned) return;

    const [config] = await queries.getConfig();
    Context.reply(`*${config.shopname} Bot — Creato da ||travexyz||*`, {
        parse_mode: "MarkdownV2",
        ...Markup.inlineKeyboard([[Markup.button.callback("👽 Entra", "main")]])
    });
};

const main = async (Context) => {
    const Users = await queries.getUsers();
    const user = Users.find(usr => usr.telegramID === Context.chat.id);
    if (user.banned) return;

    const [config] = await queries.getConfig();
    await Context.editMessageText(`😎 Ciao <b>${(Context.from.username) ? Context.from.username : Context.from.first_name}</b>, benvenuto in <b>${config.shopname}</b>!\n\n${(config.motd !== null) ? `<code>${config.motd}</code>` : `${new Date().toLocaleDateString()}`}`, { parse_mode: 'HTML' });

    if (user.admin) {
        await Context.editMessageReplyMarkup({
            inline_keyboard: [
                [Markup.button.callback("📚 Prodotti", "products")],
                [Markup.button.callback("🪪 Account", "account"), Markup.button.callback("ℹ️ Info", "info")],
                [Markup.button.callback("🛠️ Pannello Amministratori", "panel")]
            ],
        });
    } else {
        await Context.editMessageReplyMarkup({
            inline_keyboard: [
                [Markup.button.callback("📚 Prodotti", "products")],
                [Markup.button.callback("🪪 Account", "account"), Markup.button.callback("ℹ️ Info", "info")],
            ],
        });
    }
};

const products = async (Context) => {
    const Users = await queries.getUsers();
    const user = Users.find(usr => usr.telegramID === Context.chat.id);
    if (user.banned) return;

    const [config] = await queries.getConfig();
    let message = `📚 <b>Prodotti di ${config.shopname}\n</b>💰 <b>Grana:</b> <code>${user.balance}${config.currency}</code>\n\n`;

    const Products = await queries.getProducts();
    Products.forEach(item => {
        if (item.hidden && !user.admin) return;

        let stock = item.stock;
        if (stock === 0) {
            stock = "SOLD OUT";
        } else if (stock === -1) {
            stock = "UNLIMITED";
        }
        message += `<b>‼️ ${item.name}</b>\n💸 Prezzo: <code>${item.price}${config.currency}</code>\n🎰 Stock: <code>${stock}</code>\n\n`;
    });
    await Context.editMessageText(message, { parse_mode: 'HTML' });

    let markup = {
        inline_keyboard: [
            [Markup.button.url("💫 Acquista", "tg://user?id=304506948"), Markup.button.callback("↩️ Indietro", "main")]
        ]
    };
    await Context.editMessageReplyMarkup(markup);
};

const account = async (Context) => {
    const Users = await queries.getUsers();
    const user = Users.find(usr => usr.telegramID === Context.chat.id);
    if (user.banned) return;

    const [config] = await queries.getConfig();
    await Context.editMessageText(`👤 <b>Username</b> <code>${Context.chat.username}</code>${(user.admin) ? " <i>amministratore</i>" : ""}
🆔 <b>ID:</b> <code>${Context.chat.id}</code>
💵 <b>Grana:</b> <code>${user.balance}${config.currency}</code>
📏 <b>Pisello:</b> <code>${user.pisello}cm ${(user.pisello > 10) ? "😱" : "😮‍💨"}</code>`, { parse_mode: 'HTML' });

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "main")]
        ]
    });
};

const info = async (Context) => {
    const Users = await queries.getUsers();
    const user = Users.find(usr => usr.telegramID === Context.chat.id);
    if (user.banned) return;
    await Context.editMessageText("*🤖 Creato da ||travexyz|| con tanto ||❤️|| in nodejs*", { parse_mode: 'MarkdownV2' });

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.url("Contatta Sviluppatore", "tg://user?id=304506948")],
            [Markup.button.callback("↩️ Indietro", "main")]
        ]
    });
};

const panel = async (Context) => {
    const Users = await queries.getUsers();
    const user = Users.find(usr => usr.telegramID === Context.chat.id);
    if (user.banned) return;
    if (!user.admin) return;
    await Context.editMessageText(`<b>🛠️ Pannello Amministratori</b>`, { parse_mode: 'HTML' });

    let markup = {
        inline_keyboard: [
            [Markup.button.callback("➕ Aggiungi Prodotto", "addproduct"), Markup.button.callback("❌ Rimuovi Prodotto", "rmproduct")],
            [Markup.button.callback("✍️ Modifica Prodotto", "editproduct")],
            [Markup.button.callback("➕ Aggiungi Admin", "addadmin"), Markup.button.callback("❌ Rimuovi Admin", "rmadmin")],
            [Markup.button.callback("👥 Gestisci Utenti", "manageusers")],
            [Markup.button.callback("📣 Trasmetti messaggio", "broadcast")],
            [Markup.button.callback("📝 Configurazione Bot", "config")],
            [Markup.button.callback("↩️ Indietro", "main")]
        ]
    };

    await Context.editMessageReplyMarkup(markup);
};

module.exports = { start, main, products, account, info, panel };