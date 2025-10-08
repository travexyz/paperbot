const logger = require("../../pinoConfig");
const pool = require("../dbConfig");

async function getShopLockStatus() {
    let settings;
    try {
        [settings] = await pool.query("SELECT is_locked FROM settings");
        logger.debug(`Successfully executed database query in getShopLockStatus`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in getShopLockStatus`);
        throw err;
    }
    return settings[0]["is_locked"];
}

async function getSettings() {
    let settings;
    try {
        [settings] = await pool.query("SELECT * FROM settings");
        logger.debug(`Successfully executed database query in getSettings`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in getSettings`);
        throw err;
    }
    return settings[0];
}

async function updateMotd(newMotd, author) {
    try {
        await pool.query(`UPDATE settings
                          SET motd=?`, [newMotd]);
        logger.warn(`MOTD edited by ${author}: newMotd=${newMotd}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in updateMotd by ${author}`);
        throw err;
    }
}

async function updateShopName(newShopName, author) {
    try {
        await pool.query(`UPDATE settings
                          SET shop_name=?`, [newShopName]);
        logger.warn(`Shop name edited by ${author}: newShopName=${newShopName}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in updateShopName by ${author}`);
        throw err;
    }
}

async function updateCurrency(newCurrency, author) {
    try {
        await pool.query(`UPDATE settings SET currency=?`, [newCurrency]);
        logger.warn(`Currency updated by ${author}: newCurrency=${newCurrency}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in updateCurrency by ${author}`);
        throw err;
    }
}

module.exports = {
    getShopLockStatus,
    getSettings,
    updateMotd,
    updateShopName,
    updateCurrency
};