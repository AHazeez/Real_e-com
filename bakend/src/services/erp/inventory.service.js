const BaseErpService = require('./baseErp.service');

class InventoryErpService extends BaseErpService {
  constructor() {
    super('inventory');
  }

  queueInventorySync(payload) {
    return this.push('inventory.updated', payload);
  }
}

module.exports = new InventoryErpService();
