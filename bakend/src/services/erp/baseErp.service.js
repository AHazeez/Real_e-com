class BaseErpService {
  constructor(moduleName) {
    this.moduleName = moduleName;
  }

  async push(eventName, payload) {
    // Replace this adapter with Zoho ERP API calls when credentials and mappings are available.
    return {
      queued: true,
      provider: 'zoho-ready-adapter',
      module: this.moduleName,
      event: eventName,
      payload
    };
  }
}

module.exports = BaseErpService;
