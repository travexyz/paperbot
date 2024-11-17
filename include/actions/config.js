// File: include/actions/config.js
// Desc: Azioni per la configurazione del bot + broadcast
// Data: 15/04/2024
const { Markup } = require('telegraf');
const pool = require("../../src/db.js");
const queries = require("../../src/queries.js");

const broadcast = async (Context) => {
    const Users = await queries.getUsers()
    const user = Users.find(usr => usr.telegramID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.editMessageText(`<b>Sei sicuro di voler mandare un messaggio a tutti gli utenti e admin del bot?</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("✅", `dobroadcast`), Markup.button.callback("❌", "panel")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

const dobroadcast = async (Context) => {
    const Users = await queries.getUsers()
    const user = Users.find(usr => usr.telegramID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.scene.enter("broadcast")
}

const config = async (Context) => {

    const Users = await queries.getUsers()
    const user = Users.find(usr => usr.telegramID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    const Config = (await pool.query("SELECT * FROM config"))[0][0]
    await Context.editMessageText(`Nome attuale: <code>${Config.shopname}</code>\nValuta: <code>${Config.currency}</code>\n\n<b>❓ Cosa vuoi fare</b>`, { parse_mode: 'HTML' })

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            [Markup.button.callback("Cambia nome shop", "editshopname")],
            [Markup.button.callback("Cambia valuta", "currency")],
            [Markup.button.callback("Messaggio del Giorno", "motd")],
            [Markup.button.callback("↩️ Indietro", "panel")]
        ]
    })
}

const editshopname = async (Context) => {
    const Users = await queries.getUsers()
    const user = Users.find(usr => usr.telegramID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await Context.scene.enter("editshopname")
}

const currency = async (Context) => {

    const Users = await queries.getUsers()
    const user = Users.find(usr => usr.telegramID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    const Config = (await pool.query(`SELECT * FROM config`))[0][0]
    await Context.editMessageText(`La valuta corrente è: <code>${Config.currency}</code>\nChe valuta vuoi usare?`, { parse_mode: 'HTML' })

    await Context.editMessageReplyMarkup({
        inline_keyboard: [
            /*
            [Markup.button.callback("EUR", "eur"), Markup.button.callback("USD", "usd"), Markup.button.callback("JPY", "jpy"), Markup.button.callback("GBP", "gbp")],
            [Markup.button.callback("AUD", "aud"), Markup.button.callback("CAD", "cad"), Markup.button.callback("CHF", "chf"), Markup.button.callback("CNH", "cnh") ],
            */
            [Markup.button.callback("€", "euro"), Markup.button.callback("$", "dollar"), Markup.button.callback("¥", "yen"), Markup.button.callback("£", "pound")],
            [Markup.button.callback("↩️ Indietro", "panel")]
        ]
    })
}

const euro = async (Context) => {
    const Users = await queries.getUsers()
    const user = Users.find(usr => usr.telegramID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await queries.updateCurrency('€')
    if (debug) console.warn(`${Date.now()} currency changed to euro. author user key ${user.id}`)
    await Context.editMessageText(`<b>Valuta impostata ad euro €!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "currency")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

const dollar = async (Context) => {
    const Users = await queries.getUsers()
    const user = Users.find(usr => usr.telegramID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await queries.updateCurrency('$')
    if (debug) console.warn(`${Date.now()} currency changed to dollar. author user key ${user.id}`)
    await Context.editMessageText(`<b>Valuta impostata a dollari $!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "currency")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

const yen = async (Context) => {
    const Users = await queries.getUsers()
    const user = Users.find(usr => usr.telegramID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await queries.updateCurrency('¥')
    if (debug) console.warn(`${Date.now()} currency changed to yen. author user key ${user.id}`)
    await Context.editMessageText(`<b>Valuta impostata a yen ¥!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "currency")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

const pound = async (Context) => {
    const Users = await queries.getUsers()
    const user = Users.find(usr => usr.telegramID == Context.chat.id)
    if (user.banned) return
    if (!user.admin) return
    await queries.updateCurrency('£')
    if (debug) console.warn(`${Date.now()} currency changed to pound. author user key ${user.id}`)
    await Context.editMessageText(`<b>Valuta impostata a sterline £!</b>`, { parse_mode: 'HTML' })
    let markup = {
        inline_keyboard: [
            [Markup.button.callback("↩️ Indietro", "currency")]
        ]
    }
    await Context.editMessageReplyMarkup(markup)
}

module.exports = { broadcast, dobroadcast, config, editshopname, currency, euro, dollar, yen, pound }