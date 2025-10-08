const logger = require("../../pinoConfig");
const pool = require("../dbConfig");

async function getProducts() {
    let product;
    try {
        [product] = await pool.query("SELECT * FROM product");
        logger.debug(`Successfully executed database query in getProducts`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in getProducts`);
        throw err;
    }
    return product;
}

async function getProductById(id) {
    try {
        const [product] = await pool.query('SELECT * FROM product WHERE product_id=?', [id]);
        logger.debug(`Successfully executed database query in getProductById`);
        return product[0];
    } catch (error) {
        logger.error(error, `Unknown error performing query in getProductById`);
        throw error;
    }
}

async function addProduct(name, price, stock, is_visible, author) {
    try {
        await pool.query(`INSERT INTO product (name, price, stock, is_visible)
                          VALUES (?, ?, ?, ?)`, [name, price, stock, is_visible ? 1 : 0]);
        logger.warn(`Product added by ${author}: name=${name}, price=${price}, stock=${stock}, is_visible=${is_visible}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in addProduct by ${author}`);
        throw err;
    }
}

async function updateProductName(productId, newName, author) {
    try {
        await pool.query(`UPDATE product
                          SET name=?
                          WHERE product_id=?`, [newName, productId]);
        logger.warn(`Product name changed by ${author}: newName=${newName}, productId=${productId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in updateProductName by ${author}`);
        throw err;
    }
}

async function updateProductPrice(productId, newPrice, author) {
    try {
        await pool.query(`UPDATE product
                          SET price=?
                          WHERE product_id=?`, [newPrice, productId]);
        logger.warn(`Product price changed by ${author}: newPrice=${newPrice}, productId=${productId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in updateProductPrice by ${author}`);
        throw err;
    }
}

async function updateProductStock(productId, newStock, author) {
    try {
        await pool.query(`UPDATE product
                          SET stock=?
                          WHERE product_id=?`, [newStock, productId]);
        logger.warn(`Product stock changed by ${author}: newStock=${newStock}, productId=${productId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in updateProductStock by ${author}`);
        throw err;
    }
}

async function deleteProduct(productId, author) {
    try {
        await pool.query(`DELETE FROM product WHERE product_id=?`, [productId]);
        logger.warn(`Product deleted by ${author}: productId=${productId}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in deleteProduct by ${author}`);
        throw err;
    }
}

async function updateProductVisibility(productId, visibility, author) {
    try {
        await pool.query(`UPDATE product SET is_visible=? WHERE product_id=?`, [visibility, productId]);
        logger.warn(`Product visibility updated by ${author}: productId=${productId}, visibility=${visibility}`);
    } catch (err) {
        logger.error(err, `Unknown error performing query in updateProductVisibility by ${author}`);
        throw err;
    }
}

module.exports = {
    getProducts,
    getProductById,
    addProduct,
    updateProductName,
    updateProductPrice,
    updateProductStock,
    deleteProduct,
    updateProductVisibility
};