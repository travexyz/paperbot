const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    connectionLimit: 50, // consider increasing
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPWD,
    database: process.env.DBNAME
})

module.exports = pool;