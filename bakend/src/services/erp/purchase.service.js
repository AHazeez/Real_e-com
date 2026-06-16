const BaseErpService = require('./baseErp.service');

class PurchaseErpService extends BaseErpService {
  constructor() {
    super('purchase');
  }
}

module.exports = new PurchaseErpService();
