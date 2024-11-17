// File: include/db.js
// Descrizione: File contenente il comando di configurazione per il database
// Autore: travexyz
// Data: 14/04/2024

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    connectionLimit: 50,
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPWD,
    database: process.env.DBNAME
})

module.exports = pool;