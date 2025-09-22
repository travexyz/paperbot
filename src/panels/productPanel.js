const {Markup} = require('telegraf')
const helpers = require("../helpers")
const queries = require("../config/database/dbQueries");

const addproduct = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context)) return;

    await Context.scene.enter("addproduct")
}

const rmproduct = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context)) return;

    await Context.editMessageText(`<b>Seleziona il prodotto che vuoi rimuovere:</b>`, {parse_mode: 'HTML'})

    let keyboard = []
    var Products = await queries.getProducts(Context.from.username)
    for (const item of Products) {
        keyboard.push([Markup.button.callback(item.name, `rmproduct-${item.id}`)])
    }

    keyboard.push([Markup.button.callback("↩️ Indietro", "panel")])
    let markup = {
        inline_keyboard: keyboard
    }

    await Context.editMessageReplyMarkup(markup)
}

const rmproductconfirm = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context)) return;

    let id = Context.match[0].split("-")[1]
    var product = await queries.getProductById(id)

    await Context.editMessageText(`<b>Sei sicuro che vuoi eliminare il prodotto?\n✍️ Nome: <code>${product.name}</code>\n💵 Prezzo: <code>${product.price}</code>\n🎰 Stock: <code>${product.stock}</code>\n👁️‍🗨️ Visibiltà: <code>${(product.visible ? "mostrato" : "nascosto")}</code></b>`, {parse_mode: 'HTML'})
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `productrm-${product.id}`), Markup.button.callback("❌", "rmproduct")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

const productrm = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context)) return;

    let id = Context.match[0].split("-")[1]
    await queries.deleteProduct(id, Context.from.username)

    await Context.editMessageText(`<b>Prodotto eliminato!</b>`, {parse_mode: 'HTML'})
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "rmproduct")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

const editproduct = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context)) return;

    await Context.editMessageText(`<b>Seleziona il prodotto che vuoi modificare:</b>`, {parse_mode: 'HTML'})
    let keyboard = []
    var Products = await queries.getProducts(Context.from.username)
    for (const item of Products) {
        keyboard.push([Markup.button.callback(item.name, `editproduct-${item.id}`)])
    }

    keyboard.push([Markup.button.callback("↩️ Indietro", "panel")])
    let markup = {
        inline_keyboard: keyboard
    }

    await Context.editMessageReplyMarkup(markup)
}

const editproductconfirm = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context)) return;

    let id = Context.match[0].split("-")[1]
    var product = await queries.getProductById(id)

    await Context.editMessageText(`<b>Cosa vuoi cambiare del prodotto?\n✍️ Nome: <code>${product.name}</code>\n💵 Prezzo: <code>${product.price}</code>\n🎰 Stock: <code>${product.stock}</code>\n👁️‍🗨️ Visibiltà: <code>${(product.visible ? "mostrato" : "nascosto")}</code></b>`, {parse_mode: 'HTML'})
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✍️ Nome", `changename-${product.id}`), Markup.button.callback("💵 Prezzo", `changeprice-${product.id}`), Markup.button.callback("🎰 Stock", `changestock-${product.id}`)],
            [Markup.button.callback("👁️‍🗨️ Visibilita", `changevis-${product.id}`)],
            [Markup.button.callback("❌ Rimuovi", `rmproduct-${product.id}`)],
            [Markup.button.callback("↩️ Indietro", "editproduct")]
        ]
    }

    await Context.editMessageReplyMarkup(markup)
}

const changename = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context)) return;

    let id = Context.match[0].split("-")[1]

    await Context.scene.enter("editname", {productId: id})
}

const changeprice = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context)) return;

    let id = Context.match[0].split("-")[1]

    await Context.scene.enter("editprice", {productId: id})
}

const changestock = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context)) return;

    let id = Context.match[0].split("-")[1]

    await Context.scene.enter("editstock", {productId: id})
}

const changevis = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context)) return;

    let id = Context.match[0].split("-")[1]
    var product = await queries.getProductById(id);

    await Context.editMessageText(`<b>Vuoi nascondere o mostrare il prodotto <code>${product.name}</code>? (adesso è ${(product.visible) ? "mostrato" : "nascosto"}</b>`, {parse_mode: 'HTML'})
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("Nascondi", `hide-${product.id}`), Markup.button.callback("Mostra", `show-${product.id}`)]
        ]
    }

    await Context.editMessageReplyMarkup(markup)
}

const hide = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context)) return;

    let id = Context.match[0].split("-")[1]
    await queries.updateProductVisibility(id, false, Context.from.username)

    await Context.editMessageText(`<b>Prodotto nascosto!</b>`, {parse_mode: 'HTML'})
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", `editproduct-${id}`)]
        ]
    }

    await Context.editMessageReplyMarkup(markup)
}

const show = async (Context) => {
    if (!await helpers.hasAdministratorAccess(Context)) return;

    let id = Context.match[0].split("-")[1]
    await queries.updateProductVisibility(id, true, Context.from.username)

    await Context.editMessageText(`<b>Il prodotto è ora visibile!</b>`, {parse_mode: 'HTML'})
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", `editproduct-${id}`)]
        ]
    }

    await Context.editMessageReplyMarkup(markup)
}

module.exports = {
    addproduct,
    rmproduct,
    rmproductconfirm,
    productrm,
    editproduct,
    editproductconfirm,
    changename,
    changeprice,
    changestock,
    changevis,
    hide,
    show
}