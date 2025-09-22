const queries = require("./config/database/dbQueries");

const hasUserAccess = async (Context) => {
    const user = await queries.getUserByTelegramId(Context.from.id);
    if (user.banned) return false

    const config = await queries.getConfig();
    if (config.shopLockdown) return false
    else return true
}

const hasAdministratorAccess = async (Context) => {
    const user = await queries.getUserByTelegramId(Context.chat.id);
    if (user.banned) return false
    else if (!user.admin) return false
    else return true
}

module.exports = {hasUserAccess, hasAdministratorAccess}