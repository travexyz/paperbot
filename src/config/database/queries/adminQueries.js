const logger = require("../../pinoConfig");
const client = require("../../clientConfig");
const pool = require("../dbConfig");

async function addAdmin(userId, author) {
    try {
        await pool.query(`UPDATE user
                          SET is_admin=TRUE
                          WHERE id=?`, [userId]);
        logger.warn(`User added as admin by ${author}: userId=${userId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in addAdmin by ${author}`);
        throw err;
    }
}

async function removeAdmin(userId, author) {
    try {
        await pool.query(`UPDATE user SET is_admin=FALSE WHERE id=?`, [userId]);
        logger.warn(`User removed from admin by ${author}: userId=${userId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in removeAdmin by ${author}`);
        throw err;
    }
}

async function broadcastMessage(message, author) {
    try {
        const [users] = await pool.query(`SELECT telegram_id FROM user`);
        for (const user of users) {
            client.telegram.sendMessage(user.telegram_id, message);
        }
        logger.warn(`Broadcasted message by ${author}: message="${message}"`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in broadcastMessage by ${author}`);
        throw err;
    }
}

module.exports = {
    addAdmin,
    removeAdmin,
    broadcastMessage
};