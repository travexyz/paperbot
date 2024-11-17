const logger = require("./logger");
const pool = require("./db");

async function getConfig() {
    let results;
    try {
        [results] = await pool.query("SELECT * FROM config");
    } catch (err) {
        logger.error(err, "Unknown error performing query in getConfig");
    } finally {
        logger.debug("Successfully executed database query in getConfig");
    }
    return results;
}

async function getProducts() {
    let results;
    try {
        [results] = await pool.query("SELECT * FROM products");
    } catch (err) {
        logger.error(err, "Unknown error performing query in getProducts");
    } finally {
        logger.debug("Successfully executed database query in getProducts");
    }
    return results;
}

async function getUsers() {
    let results;
    try {
        [results] = await pool.query("SELECT * FROM users");
    } catch (err) {
        logger.error(err, "Unknown error performing query in getUsers");
    } finally {
        logger.debug("Successfully executed database query in getUsers");
    }
    return results;
}

async function getUserById(id) {
    let results;
    try {
        [results] = await pool.query(`SELECT * FROM users WHERE id=?`, [id]);
    } catch (err) {
        logger.error(err, "Unknown error performing query in getUserById");
    }
    return results[0];
}

async function initializeUser(userId) {
    try {
        await pool.query(`INSERT INTO users (telegramID, balance, admin, banned, pisello)
                          VALUES (?, 0.00, 0, 0, ${Math.floor(Math.random() * 20)})`, [userId]);
    } catch (err) {
        logger.error(err, "Unknown error performing query in initializeUser");
    } finally {
        logger.info(`New user added to db: userId=${userId}`);
    }
}

async function addProduct(name, price, stock, visible) {
    try {
        await pool.query(`INSERT INTO products (name, price, stock, visible)
                          VALUES (?, ?, ?, ?)`, [name, price, stock, visible ? 1 : 0]);
        logger.warn(`Product added: name=${name}, price=${price}, stock=${stock}, visible=${visible}`);
    } catch (err) {
        logger.error(err, "Unknown error performing query in addProduct");
    }
}

async function updateProductName(productId, newName) {
    try {
        await pool.query(`UPDATE products
                          SET name=?
                          WHERE id = ?`, [newName, productId]);
        logger.warn(`Product name changed: newName=${newName}, productId=${productId}`);
    } catch (err) {
        logger.error(err, "Unknown error performing query in updateProductName");
    }
}

async function updateProductPrice(productId, newPrice) {
    try {
        await pool.query(`UPDATE products
                          SET price=?
                          WHERE id = ?`, [newPrice, productId]);
        logger.warn(`Product price changed: newPrice=${newPrice}, productId=${productId}`);
    } catch (err) {
        logger.error(err, "Unknown error performing query in updateProductPrice");
    }
}

async function updateProductStock(productId, newStock) {
    try {
        await pool.query(`UPDATE products
                          SET stock=?
                          WHERE id = ?`, [newStock, productId]);
        logger.warn(`Product stock changed: newStock=${newStock}, productId=${productId}`);
    } catch (err) {
        logger.error(err, "Unknown error performing query in updateProductStock");
    }
}

async function deleteProduct(productId) {
    try {
        await pool.query(`DELETE FROM products WHERE id=?`, [productId]);
        logger.warn(`Product deleted: productId=${productId}`);
    } catch (err) {
        logger.error(err, "Unknown error performing query in deleteProduct");
    }
}

async function updateProductVisibility(productId, visibility) {
    try {
        await pool.query(`UPDATE products SET visible=? WHERE id=?`, [visibility, productId]);
        logger.warn(`Product visibility updated: productId=${productId}, visibility=${visibility}`);
    } catch (err) {
        logger.error(err, "Unknown error performing query in updateProductVisibility");
    }
}

async function addAdmin(userId) {
    try {
        await pool.query(`UPDATE users
                          SET admin= TRUE
                          WHERE id = ?`, [userId]);
        logger.warn(`User added as admin: userId=${userId}`);
    } catch (err) {
        logger.error(err, "Unknown error performing query in addAdmin");
    }
}

async function removeAdmin(userId) {
    try {
        await pool.query(`UPDATE users SET admin=FALSE WHERE id=?`, [userId]);
        logger.warn(`User removed from admin: userId=${userId}`);
    } catch (err) {
        logger.error(err, "Unknown error performing query in removeAdmin");
    }
}

async function updateMotd(newMotd) {
    try {
        await pool.query(`UPDATE config
                          SET motd=?`, [newMotd]);
        logger.warn(`MOTD edited: newMotd=${newMotd}`);
    } catch (err) {
        logger.error(err, "Unknown error performing query in updateMotd");
    }
}

async function updateShopName(newShopName) {
    try {
        await pool.query(`UPDATE config
                          SET shopname=?`, [newShopName]);
        logger.warn(`Shop name edited: newShopName=${newShopName}`);
    } catch (err) {
        logger.error(err, "Unknown error performing query in updateShopName");
    }
}

async function setUserCredit(userId, newCredit) {
    try {
        await pool.query(`UPDATE users
                          SET balance=?
                          WHERE id = ?`, [parseFloat(newCredit), userId]);
        logger.warn(`User credit set: newCredit=${parseFloat(newCredit)}, userId=${userId}`);
    } catch (err) {
        logger.error(err, "Unknown error performing query in setUserCredit");
    }
}

async function addUserCredit(userId, addedCredit) {
    try {
        const [user] = await pool.query(`SELECT balance
                                         FROM users
                                         WHERE id = ?`, [userId]);
        const newCredit = user[0].balance + parseFloat(addedCredit);
        await pool.query(`UPDATE users
                          SET balance=?
                          WHERE id = ?`, [newCredit, userId]);
        logger.warn(`User credit added: addedCredit=${parseFloat(addedCredit)}, newCredit=${newCredit}, userId=${userId}`);
    } catch (err) {
        logger.error(err, "Unknown error performing query in addUserCredit");
    }
}

async function removeUserCredit(userId, removedCredit) {
    try {
        const [user] = await pool.query(`SELECT balance
                                         FROM users
                                         WHERE id = ?`, [userId]);
        const newCredit = user[0].balance - parseFloat(removedCredit);
        await pool.query(`UPDATE users
                          SET balance=?
                          WHERE id = ?`, [newCredit, userId]);
        logger.warn(`User credit removed: removedCredit=${parseFloat(removedCredit)}, newCredit=${newCredit}, userId=${userId}`);
    } catch (err) {
        logger.error(err, "Unknown error performing query in removeUserCredit");
    }
}

async function banUser(id) {
    try {
        await pool.query(`UPDATE users SET banned=TRUE WHERE id=?`, [id]);
    } catch (err) {
        logger.error(err, "Unknown error performing query in banUser");
    }
}

async function broadcastMessage(message) {
    try {
        const [users] = await pool.query(`SELECT telegramID
                                          FROM users`);
        users.forEach(user => {
            client.telegram.sendMessage(user.telegramID, message);
        });
        logger.info(`Broadcasted message: message="${message}"`);
    } catch (err) {
        logger.error(err, "Unknown error performing query in broadcastMessage");
    }
}

async function updateCurrency(newCurrency) {
    try {
        await pool.query(`UPDATE config SET currency=?`, [newCurrency]);
        logger.warn(`Currency updated: newCurrency=${newCurrency}`);
    } catch (err) {
        logger.error(err, "Unknown error performing query in updateCurrency");
    }
}

const getProductById = async (id) => {
    try {
        const product = await db.query('SELECT * FROM products WHERE id = $1', [id]);
        return product.rows[0];
    } catch (error) {
        console.error('Errore durante il recupero del prodotto per ID:', error);
        throw error;
    }
}

module.exports = {
    getConfig,
    getProducts,
    getUsers,
    getUserById,
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
    broadcastMessage,
    updateCurrency,
    getProductById
};