const queries = require("../config/database/dbQueries");

const isBanned = async (Context) => {
    const user = await queries.getUserByTelegramId(Context.from.id);
    if (user.banned) return true
    else return false
}

const hasPassedAdminChecks = async (Context) => {
    const user = await queries.getUserByTelegramId(Context.from.id);
    if (user.banned) return false
    else if (user.banned) return false
    else return true
}

module.exports = {isBanned, hasPassedAdminChecks}