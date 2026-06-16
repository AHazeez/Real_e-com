const BaseErpService = require('./baseErp.service');

class FinanceErpService extends BaseErpService {
  constructor() {
    super('finance');
  }
}

module.exports = new FinanceErpService();
