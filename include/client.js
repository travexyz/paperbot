// File: include/client.js
// Desc: Inizializzazione del client
// Data: 14/04/2024

const { Telegraf } = require('telegraf')
const pool = require("./db.js")

const client = new Telegraf(process.env.TOKEN)

client.catch(async (e) => {
    console.error(e)
    results = await pool.query("SELECT * FROM users WHERE admin=TRUE")
    results.forEach(admin => { client.telegram.sendMessage(admin[0].userID, `Errore: \`\`\`${e}\`\`\``, { parse_mode: "MarkdownV2" }) })
})

module.exports = client;