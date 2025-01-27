const logger = require("../pinoConfig");
const client = require("../clientConfig");
const pool = require("./dbConfig");

async function getConfig() {
    let config;
    try {
        [config] = await pool.query("SELECT * FROM config");
        logger.debug(`Successfully executed database query in getConfig`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in getConfig`);
        throw err;
    }
    return config[0];
}

async function getProducts() {
    let products;
    try {
        [products] = await pool.query("SELECT * FROM products");
        logger.debug(`Successfully executed database query in getProducts`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in getProducts`);
        throw err;
    }
    return products;
}

async function getUsers() {
    let users;
    try {
        [users] = await pool.query("SELECT * FROM users");
        logger.debug(`Successfully executed database query in getUsers`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in getUsers`);
        throw err;
    }
    return users;
}

async function getUserById(id) {
    let results;
    try {
        [results] = await pool.query(`SELECT * FROM users WHERE id=?`, [id]);
        logger.debug(`Successfully executed database query in getUserById`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in getUserById`);
        throw err;
    }

    if (results.length === 0) {
        logger.error(`No user found with ID: ${id}`);
        return null;
    }

    return results[0];
}

async function getUserByTelegramId(id) {
    let results;
    try {
        [results] = await pool.query(`SELECT * FROM users WHERE telegramID=?`, [id]);
        logger.debug(`Successfully executed database query in getUserByTelegramId`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in getUserByTelegramId`);
        throw err;
    }

    if (results.length === 0) {
        logger.error(`No user found with ID: ${id}`);
        return null;
    }

    return results[0];
}

async function initializeUser(userId) {
    try {
        await pool.query(`INSERT INTO users (telegramID, balance, admin, banned, pisello)
                          VALUES (?, 0.00, 0, 0, ${Math.floor(Math.random() * 20)})`, [userId]);
        logger.info(`New user added to db userId=${userId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in initializeUser`);
        throw err;
    }
}

async function addProduct(name, price, stock, visible, author) {
    try {
        await pool.query(`INSERT INTO products (name, price, stock, visible)
                          VALUES (?, ?, ?, ?)`, [name, price, stock, visible ? 1 : 0]);
        logger.warn(`Product added by ${author}: name=${name}, price=${price}, stock=${stock}, visible=${visible}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in addProduct by ${author}`);
        throw err;
    }
}

async function updateProductName(productId, newName, author) {
    try {
        await pool.query(`UPDATE products
                          SET name=?
                          WHERE id = ?`, [newName, productId]);
        logger.warn(`Product name changed by ${author}: newName=${newName}, productId=${productId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in updateProductName by ${author}`);
        throw err;
    }
}

async function updateProductPrice(productId, newPrice, author) {
    try {
        await pool.query(`UPDATE products
                          SET price=?
                          WHERE id = ?`, [newPrice, productId]);
        logger.warn(`Product price changed by ${author}: newPrice=${newPrice}, productId=${productId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in updateProductPrice by ${author}`);
        throw err;
    }
}

async function updateProductStock(productId, newStock, author) {
    try {
        await pool.query(`UPDATE products
                          SET stock=?
                          WHERE id = ?`, [newStock, productId]);
        logger.warn(`Product stock changed by ${author}: newStock=${newStock}, productId=${productId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in updateProductStock by ${author}`);
        throw err;
    }
}

async function deleteProduct(productId, author) {
    try {
        await pool.query(`DELETE FROM products WHERE id=?`, [productId]);
        logger.warn(`Product deleted by ${author}: productId=${productId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in deleteProduct by ${author}`);
        throw err;
    }
}

async function updateProductVisibility(productId, visibility, author) {
    try {
        await pool.query(`UPDATE products SET visible=? WHERE id=?`, [visibility, productId]);
        logger.warn(`Product visibility updated by ${author}: productId=${productId}, visibility=${visibility}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in updateProductVisibility by ${author}`);
        throw err;
    }
}

async function addAdmin(userId, author) {
    try {
        await pool.query(`UPDATE users
                          SET admin= TRUE
                          WHERE id = ?`, [userId]);
        logger.warn(`User added as admin by ${author}: userId=${userId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in addAdmin by ${author}`);
        throw err;
    }
}

async function removeAdmin(userId, author) {
    try {
        await pool.query(`UPDATE users SET admin=FALSE WHERE id=?`, [userId]);
        logger.warn(`User removed from admin by ${author}: userId=${userId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in removeAdmin by ${author}`);
        throw err;
    }
}

async function updateMotd(newMotd, author) {
    try {
        await pool.query(`UPDATE config
                          SET motd=?`, [newMotd]);
        logger.warn(`MOTD edited by ${author}: newMotd=${newMotd}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in updateMotd by ${author}`);
        throw err;
    }
}

async function updateShopName(newShopName, author) {
    try {
        await pool.query(`UPDATE config
                          SET shopname=?`, [newShopName]);
        logger.warn(`Shop name edited by ${author}: newShopName=${newShopName}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in updateShopName by ${author}`);
        throw err;
    }
}

async function setUserCredit(userId, newCredit, author) {
    try {
        await pool.query(`UPDATE users
                          SET balance=?
                          WHERE id = ?`, [parseFloat(newCredit), userId]);
        logger.warn(`User credit set by ${author}: newCredit=${parseFloat(newCredit)}, userId=${userId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in setUserCredit by ${author}`);
        throw err;
    }
}

async function addUserCredit(userId, addedCredit, author) {
    try {
        const [user] = await pool.query(`SELECT balance
                                         FROM users
                                         WHERE id = ?`, [userId]);
        const newCredit = user[0].balance + parseFloat(addedCredit);
        await pool.query(`UPDATE users
                          SET balance=?
                          WHERE id = ?`, [newCredit, userId]);
        logger.warn(`User credit added by ${author}: addedCredit=${parseFloat(addedCredit)}, newCredit=${newCredit}, userId=${userId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in addUserCredit by ${author}`);
        throw err;
    }
}

async function removeUserCredit(userId, removedCredit, author) {
    try {
        const [user] = await pool.query(`SELECT balance
                                         FROM users
                                         WHERE id = ?`, [userId]);
        const newCredit = user[0].balance - parseFloat(removedCredit);
        await pool.query(`UPDATE users
                          SET balance=?
                          WHERE id = ?`, [newCredit, userId]);
        logger.warn(`User credit removed by ${author}: removedCredit=${parseFloat(removedCredit)}, newCredit=${newCredit}, userId=${userId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in removeUserCredit by ${author}`);
        throw err;
    }
}

async function banUser(id, author) {
    try {
        await pool.query(`UPDATE users SET banned=TRUE WHERE id=?`, [id]);
        logger.warn(`User banned by ${author}: banned user id: ${id}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in banUser by ${author}`);
        throw err;
    }
}

async function unbanUser(id, author) {
    try {
        await pool.query(`UPDATE users SET banned=FALSE WHERE id=?`, [id]);
        logger.warn(`User un-banned by ${author}: un-banned user id: ${id}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in unbanUser by ${author}`);
        throw err;
    }
}

async function broadcastMessage(message, author) {
    try {
        const [users] = await pool.query(`SELECT telegramID FROM users`);
        for (const user of users) {
            client.telegram.sendMessage(user.telegramID, message);
        }
        logger.warn(`Broadcasted message by ${author}: message="${message}"`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in broadcastMessage by ${author}`);
        throw err;
    }
}

async function updateCurrency(newCurrency, author) {
    try {
        await pool.query(`UPDATE config SET currency=?`, [newCurrency]);
        logger.warn(`Currency updated by ${author}: newCurrency=${newCurrency}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in updateCurrency by ${author}`);
        throw err;
    }
}

async function getProductById(id) {
    try {
        const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
        logger.debug(`Successfully executed database query in getProductById by ${author}`);
        return product[0]
    } catch (error) {
        logger.error(err, `Unknown error performing query in getProductById by ${author}`);
        throw error;
    }
}

module.exports = {
    getConfig,
    getProducts,
    getUsers,
    getUserById,
    getUserByTelegramId,
    initializeUser,
    addProduct,
    updateProductName,
    updateProductPrice,
    updateProductStock,
    deleteProduct,
    updateProductVisibility,
    addAdmin,
    removeAdmin,
    updateMotd,
    updateShopName,
    setUserCredit,
    addUserCredit,
    removeUserCredit,
    banUser,
    unbanUser,
    broadcastMessage,
    updateCurrency,
    getProductById
};