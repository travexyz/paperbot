// File: include/actions/product.js
// Descrizione: File contenente le azioni del pannello prodotti del bot
// Autore: travexyz
// Data: 14/04/2024

const { Markup } = require('telegraf')
const pool = require('../db.js');

const debug = true // DA AGGIORNARE

const addproduct = async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.scene.enter("addproduct")
}

const rmproduct = async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.editMessageText(`<b>Seleziona il prodotto che vuoi rimuovere:</b>`, { parse_mode: 'HTML' })

    let keyboard = []
    var Products = await getProducts()
    Products[0].forEach(item => {
        keyboard.push([Markup.button.callback(item.name, `rmproduct-${item.id}`)])
    })
    keyboard.push([Markup.button.callback("↩️ Indietro", "panel")])
    let markup = {
        inline_keyboard: keyboard
    }
    await Context.editMessageReplyMarkup(markup)
}

const rmproductconfirm = async (Context) => {
    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return

    if (!user.admin) return

    let id = Context.match[0].split("-")[1]
    var product = (await pool.query(`SELECT * FROM products WHERE id=?`, [id]))[0][0]

    await Context.editMessageText(`<b>Sei sicuro che vuoi eliminare il prodotto? <code>nome: ${product.name}</code>\n<code>prezzo: ${product.price}</code>\n<code>stock: ${product.stock}</code>\n<code>visibiltà: ${(product.visible ? "mostrato" : "nascosto")}</code></b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `productrm-${product.id}`), Markup.button.callback("❌", "rmproduct")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

const productrm = async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]
    await pool.query(`DELETE FROM products WHERE id=?`, [id])
    if (debug) console.warn(`${Date.now()} product deleted. victim product key: ${id}, author user key: ${user.id}`)
    await Context.editMessageText(`<b>Prodotto eliminato!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "rmproduct")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

const editproduct = async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.editMessageText(`<b>Seleziona il prodotto che vuoi modificare:</b>`, { parse_mode: 'HTML' })

    let keyboard = []
    Products = await getProducts()
    Products[0].forEach(item => {
        keyboard.push([Markup.button.callback(item.name, `editproduct-${item.id}`)])
    })
    keyboard.push([Markup.button.callback("↩️ Indietro", "panel")])
    let markup = {
        inline_keyboard: keyboard
    }
    await Context.editMessageReplyMarkup(markup)
}

const editproductconfirm = async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]
    var product = (await pool.query(`SELECT * FROM products WHERE id=?`, [id]))[0][0]
    await Context.editMessageText(`<b>Cosa vuoi cambiare del prodotto?\n<code>nome: ${product.name}</code>\n<code>prezzo: ${product.price}</code>\n<code>stock: ${product.stock}</code>\n<code>visibiltà: ${(product.visible ? "mostrato" : "nascosto")}</code></b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("Nome", `changename-${product.id}`), Markup.button.callback("Prezzo", `changeprice-${product.id}`), Markup.button.callback("Stock", `changestock-${product.id}`)],
            [Markup.button.callback("Visibilita", `changevis-${product.id}`)],
            [Markup.button.callback("Rimuovi", `rmproduct-${product.id}`)],
            [Markup.button.callback("↩️ Indietro", "editproduct")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

const changename = async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("editname", { productId: id })
}

const changeprice = async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("editprice", { productId: id })
}

const changestock = async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    let id = Context.match[0].split("-")[1]
    await Context.scene.enter("editstock", { productId: id })
}

const changevis = async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]
    var product
    product = (await pool.query(`SELECT * FROM products WHERE id=?`, [id]))[0][0]
    await Context.editMessageText(`<b>Vuoi nascondere o mostrare il prodotto <code>${product.name}</code>? (adesso è ${(product.visible) ? "mostrato" : "nascosto"})</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("Nascondi", `hide-${product.id}`), Markup.button.callback("Mostra", `show-${product.id}`)]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

const hide = async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]

    await pool.query(`UPDATE products SET visible=FALSE WHERE id=?`, [id])

    await Context.editMessageText(`<b>Prodotto nascosto!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", `editproduct-${id}`)]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

const show = async (Context) => {

    const Users = (await getUsers())[0]
    const user = Users.find(usr => usr.userID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return

    let id = Context.match[0].split("-")[1]

    await pool.query(`UPDATE products SET visible=TRUE WHERE id=?`, [id])

    await Context.editMessageText(`<b>Il prodotto è ora visibile!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", `editproduct-${id}`)]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

module.exports = { addproduct, rmproduct, rmproductconfirm, productrm, editproduct, editproductconfirm, changename, changeprice, changestock, changevis, hide, show }