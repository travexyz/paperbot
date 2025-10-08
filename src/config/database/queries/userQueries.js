const logger = require("../../pinoConfig");
const pool = require("../dbConfig");

async function getUserBanStatus(telegram_id) {
    let results;
    try {
        [results] = await pool.query(`SELECT is_banned FROM user WHERE telegram_id=?`, [telegram_id]);
        logger.debug(`Successfully executed database query in getUserBanStatus`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in getUserBanStatus`);
        throw err;
    }

    if (results.length === 0) {
        logger.error(`No user found with telegram id: ${telegram_id}`);
        return null;
    }

    return results[0]["is_banned"];
}

async function getUserAdminStatus(telegram_id) {
    let results;
    try {
        [results] = await pool.query(`SELECT is_admin FROM user WHERE telegram_id=?`, [telegram_id]);
        logger.debug(`Successfully executed database query in getUserAdminStatus`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in getUserAdminStatus`);
        throw err;
    }

    if (results.length === 0) {
        logger.error(`No user found with telegram id: ${telegram_id}`);
        return null;
    }

    return results[0]["is_admin"];
}

async function initializeUser(telegram_id) {
    try {
        await pool.query(`INSERT INTO user (telegram_id, balance, is_admin, is_banned, pisello_length)
                          VALUES (?, 0.00, 0, 0, ${Math.floor(Math.random() * 30)})`, [telegram_id]);
        logger.info(`New user added to db telegram_id=${telegram_id}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in initializeUser`);
        throw err;
    }
}

async function getUsers() {
    let user;
    try {
        [user] = await pool.query("SELECT * FROM user");
        logger.debug(`Successfully executed database query in getUsers`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in getUsers`);
        throw err;
    }
    return user;
}

async function getUserByDatabaseId(id) {
    let results;
    try {
        [results] = await pool.query(`SELECT * FROM user WHERE id=?`, [id]);
        logger.debug(`Successfully executed database query in getUserByDatabaseId`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in getUserByDatabaseId`);
        throw err;
    }

    if (results.length === 0) {
        logger.error(`No user found with database id: ${id}`);
        return null;
    }

    return results[0];
}

async function getUserByTelegramId(telegram_id) {
    let results;
    try {
        [results] = await pool.query(`SELECT * FROM user WHERE telegram_id=?`, [telegram_id]);
        logger.debug(`Successfully executed database query in getUserByTelegramId`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in getUserByTelegramId`);
        throw err;
    }

    if (results.length === 0) {
        logger.error(`No user found with telegram id: ${telegram_id}`);
        return null;
    }

    return results[0];
}

async function setUserCredit(userDbId, newCredit, author) {
    try {
        await pool.query(`UPDATE user
                          SET balance=?
                          WHERE id=?`, [parseFloat(newCredit), userDbId]);
        logger.warn(`User credit set by ${author}: newCredit=${parseFloat(newCredit)}, userDbId=${userDbId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in setUserCredit by ${author}`);
        throw err;
    }
}

async function addUserCredit(userDbId, addedCredit, author) {
    try {
        const [user] = await pool.query(`SELECT balance
                                         FROM user
                                         WHERE id=?`, [userDbId]);
        const newCredit = parseFloat(user[0].balance) + parseFloat(addedCredit);
        await pool.query(`UPDATE user
                          SET balance=?
                          WHERE id=?`, [newCredit, userDbId]);
        logger.warn(`User credit added by ${author}: addedCredit=${parseFloat(addedCredit)}, newCredit=${newCredit}, userDbId=${userDbId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in addUserCredit by ${author}`);
        throw err;
    }
}

async function removeUserCredit(userDbId, removedCredit, author) {
    try {
        const [user] = await pool.query(`SELECT balance
                                         FROM user
                                         WHERE id=?`, [userDbId]);
        const newCredit = user[0].balance - parseFloat(removedCredit);
        await pool.query(`UPDATE user
                          SET balance=?
                          WHERE id=?`, [newCredit, userDbId]);
        logger.warn(`User credit removed by ${author}: removedCredit=${parseFloat(removedCredit)}, newCredit=${newCredit}, userDbId=${userDbId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in removeUserCredit by ${author}`);
        throw err;
    }
}

async function banUser(id, author) {
    try {
        await pool.query(`UPDATE user SET is_banned=TRUE WHERE id=?`, [id]);
        logger.warn(`User banned by ${author}: banned user with database id: ${id}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in banUser by ${author}`);
        throw err;
    }
}

async function unbanUser(id, author) {
    try {
        await pool.query(`UPDATE user SET is_banned=FALSE WHERE id=?`, [id]);
        logger.warn(`User un-banned by ${author}: un-banned user with database id: ${id}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in unbanUser by ${author}`);
        throw err;
    }
}

module.exports = {
    getUserBanStatus,
    getUserAdminStatus,
    initializeUser,
    getUsers,
    getUserByDatabaseId,
    getUserByTelegramId,
    setUserCredit,
    addUserCredit,
    removeUserCredit,
    banUser,
    unbanUser
};