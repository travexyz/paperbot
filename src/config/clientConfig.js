const { Telegraf } = require('telegraf')
const logger = require("./pinoConfig.js")

const client = new Telegraf(process.env.TOKEN)

client.catch(async (err) => {
    logger.error(err, "Unknown client error")
})

module.exports = client;