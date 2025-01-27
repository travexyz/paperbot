require('dotenv').config();

const logger = require("./config/pinoConfig");

const {
    Scenes, session
} = require('telegraf')

// Importing modules
const scenes = require("./scenes/scenes");

const main_actions = require("./panels/mainPanel");
const product_actions = require("./panels/productPanel");
const admin_actions = require("./panels/adminPanel");
const user_actions = require("./panels/userPanel");
const config_actions = require("./panels/configPanel");
const motd_actions = require("./panels/motdPanel");

const client = require('./config/clientConfig');

client.use(session());
client.use(new Scenes.Stage([scenes.addProductScene, scenes.editNameScene, scenes.editPriceScene, scenes.editStockScene, scenes.addAdminScene, scenes.editMotdScene, scenes.setCreditScene, scenes.addCreditScene, scenes.rmCreditScene, scenes.editShopNameScene, scenes.broadcastScene]));

// "/start" command handler
client.start(main_actions.start)

// Main panel actions
client.action("main", main_actions.main)
client.action("products", main_actions.products)
client.action("account", main_actions.account)
client.action("info", main_actions.info)
client.action("panel", main_actions.panel)

// Product panel actions
client.action("addproduct", product_actions.addproduct)
client.action("rmproduct", product_actions.rmproduct)
client.action(/^rmproduct-\d+/, product_actions.rmproductconfirm)
client.action(/^productrm-\d+/, product_actions.productrm)
client.action("editproduct", product_actions.editproduct)
client.action(/^editproduct-\d+/, product_actions.editproductconfirm)
client.action(/^changename-\d+/, product_actions.changename)
client.action(/^changeprice-\d+/, product_actions.changeprice)
client.action(/^changestock-\d+/, product_actions.changestock)
client.action(/^changevis-\d+/, product_actions.changevis)
client.action(/^hide-\d+/, product_actions.hide)
client.action(/^show-\d+/, product_actions.show)

// Admin actions
client.action("manageadmins", admin_actions.manageadmins)
client.action("addadmin", admin_actions.addadmin)
client.action("adminadd", admin_actions.adminadd)
client.action(/^rmadmin-\d+/, admin_actions.rmadminconfirm)
client.action(/^adminrm-\d+/, admin_actions.adminrm)

// User actions
client.action("manageusers", user_actions.manageusers)
client.action(/^manageuser-\d+/, user_actions.manageuser)
client.action(/^setcredit-\d+/, user_actions.setcredit)
client.action(/^addcredit-\d+/, user_actions.addcredit)
client.action(/^rmcredit-\d+/, user_actions.rmcredit)
client.action(/^banuser-\d+/, user_actions.banuser)
client.action(/^userban-\d+/, user_actions.userban)
client.action(/^rmban-\d+/, user_actions.rmban)
client.action(/^banrm-\d+/, user_actions.banrm)

// Broadcast actions
client.action("broadcast", config_actions.broadcast)
client.action("dobroadcast", config_actions.dobroadcast)

// Config panel actions
client.action("config", config_actions.config)
client.action("editshopname", config_actions.editshopname)
client.action("currency", config_actions.currency)
client.action("euro", config_actions.euro)
client.action("dollar", config_actions.dollar)
client.action("yen", config_actions.yen)
client.action("pound", config_actions.pound)
client.action("motd", motd_actions.motd)
client.action("editmotd", motd_actions.editmotd)
client.action("rmmotd", motd_actions.rmmotd)
client.action("motdrm", motd_actions.motdrm)

client.launch({
    dropPendingUpdates: true
}, () => {
    logger.info('Bot started')
})