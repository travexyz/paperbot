const userQueries = require('./userQueries');
const productQueries = require('./productQueries');
const adminQueries = require('./adminQueries');
const settingsQueries = require('./settingsQueries');

module.exports = {
    // User queries
    ...userQueries,
    
    // Product queries
    ...productQueries,
    
    // Admin queries
    ...adminQueries,
    
    // Settings queries
    ...settingsQueries
};