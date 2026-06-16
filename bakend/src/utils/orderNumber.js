const { v4: uuidv4 } = require('uuid');

const createOrderNumber = () => `WC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${uuidv4().slice(0, 8).toUpperCase()}`;

module.exports = createOrderNumber;
