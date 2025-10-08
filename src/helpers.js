const queries = require("./config/database/dbQueries");

const hasUserAccess = async (telegram_id) => {
    if(await queries.getUserBanStatus(telegram_id)) return false;
    if (await queries.getShopLockStatus()) return false;
    else return true;
}

const hasAdministratorAccess = async (telegram_id) => {
    if (await queries.getUserBanStatus(telegram_id)) return false;
    if (!await queries.getUserAdminStatus(telegram_id)) return false;
    else return true
}

module.exports = {hasUserAccess, hasAdministratorAccess}