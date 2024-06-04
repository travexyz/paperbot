const {
    Scenes, session
} = require('telegraf')

require('dotenv').config();

// Loading modules from /include
const scenes = require("../include/scenes.js");
const main_actions = require("../include/actions/main.js");
const product_actions = require("../include/actions/product.js");
const admin_actions = require("../include/actions/admin.js");
const user_actions = require("../include/actions/user.js");
const config_actions = require("../include/actions/config.js");
const motd_actions = require("../include/actions/motd.js");

// Configuring database pool
const pool = require('../include/db.js');

// Configuring bot client and error handling
const client = require('../include/client.js');

// Creating async functions for db queries
getProducts = async () => {
    var results, q = "SELECT * FROM products"

    try { results = await pool.query(q); }
    catch (e) { console.error(`Database query error: ${e}`); }
    //finally { console.info(`Executed database query: ${q}`); }
    
    return results;
}
getUsers = async () => {
    var results, q = "SELECT * FROM users";

    try { results = await pool.query(q); }
    catch (e) { console.error(`Database query error: ${e}`); }
    //finally { console.info(`Executed database query: ${q}`); }
    
    return results;
}

// Confiugring wizards (scenes)
client.use(session());
client.use(new Scenes.Stage([scenes.addProduct, scenes.editName, scenes.editPrice, scenes.editStock, scenes.addAdmin, scenes.editMotd, scenes.setCredit, scenes.addCredit, scenes.rmCredit, scenes.editShopName, scenes.broadcast]));

// #region Registering action callbacks
// Azione comando start
client.start(main_actions.start)

// Azioni pannello principale
client.action("main", main_actions.main)
client.action("products", main_actions.products)
client.action("account", main_actions.account)
client.action("info", main_actions.info)
client.action("panel", main_actions.panel)

// Azioni prodotti
client.action("addproduct", product_actions.addproduct)

client.action("rmproduct", product_actions.rmproduct)
client.action(/^rmproduct-\d{1,}/, product_actions.rmproductconfirm)
client.action(/^productrm-\d{1,}/, product_actions.productrm)

client.action("editproduct", product_actions.editproduct)
client.action(/^editproduct-\d{1,}/, product_actions.editproductconfirm)
client.action(/^changename-\d{1,}/, product_actions.changename)
client.action(/^changeprice-\d{1,}/, product_actions.changeprice)
client.action(/^changestock-\d{1,}/, product_actions.changestock)
client.action(/^changevis-\d{1,}/, product_actions.changevis)
client.action(/^hide-\d{1,}/, product_actions.hide)
client.action(/^show-\d{1,}/, product_actions.show)


// Azioni gestione amministratori
client.action("addadmin", admin_actions.addadmin)
client.action("adminadd", admin_actions.adminadd)
client.action("rmadmin", admin_actions.rmadmin)
client.action(/^rmadmin-\d{1,}/, admin_actions.rmadminconfirm)
client.action(/^adminrm-\d{1,}/, admin_actions.adminrm)

// Azioni gestione utenti
client.action("manageusers", user_actions.manageusers)
client.action(/^manageuser-\d{1,}/, user_actions.manageuser)

client.action(/^setcredit-\d{1,}/, user_actions.setcredit)
client.action(/^addcredit-\d{1,}/, user_actions.addcredit)
client.action(/^rmcredit-\d{1,}/, user_actions.rmcredit)
client.action(/^banuser-\d{1,}/, user_actions.banuser)
client.action(/^userban-\d{1,}/, user_actions.userban)


// Trasmetti messaggio
client.action("broadcast", config_actions.broadcast)
client.action("dobroadcast", config_actions.dobroadcast)

// Pannello config
client.action("config", config_actions.config)
// Config: nome shop
client.action("editshopname", config_actions.editshopname)
// Config: valuta
client.action("currency", config_actions.currency)
client.action("euro", config_actions.euro)
client.action("dollar", config_actions.dollar)
client.action("yen", config_actions.yen)
client.action("pound", config_actions.pound)
// Config: MOTD
client.action("motd", motd_actions.motd)
client.action("editmotd", motd_actions.editmotd)
client.action("rmmotd", motd_actions.rmmotd)
client.action("motdrm", motd_actions.motdrm)
//#endregion

client.launch({
    dropPendingUpdates: true
})