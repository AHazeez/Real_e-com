const BaseErpService = require('./baseErp.service');

class WarehouseErpService extends BaseErpService {
  constructor() {
    super('warehouse');
  }
}

module.exports = new WarehouseErpService();
