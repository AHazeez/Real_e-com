const BaseErpService = require('./baseErp.service');

class SalesErpService extends BaseErpService {
  constructor() {
    super('sales');
  }

  queueSalesOrderSync(payload) {
    return this.push('sales_order.created', payload);
  }
}

module.exports = new SalesErpService();
