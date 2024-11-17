// File: include/client.js
// Desc: Inizializzazione del client
// Data: 14/04/2024

const { Telegraf } = require('telegraf')
const pool = require("./db.js")
const logger = require("./logger.js")

const client = new Telegraf(process.env.TOKEN)

client.catch(async (err) => {
    logger.error(err, "Unknown error caught by client catch handler")
})

module.exports = client;