const BaseErpService = require('./baseErp.service');

class ProductionErpService extends BaseErpService {
  constructor() {
    super('production');
  }
}

module.exports = new ProductionErpService();
