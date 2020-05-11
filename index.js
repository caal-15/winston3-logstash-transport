"use strict";
const LogstashTransport = require("./LogstashTransport");

class LogstashTransportMiddleware {
  constructor(options) {
    const { middlewareOptions, ...rest } = options;
    middlewareOptions.refreshCount = 0;
    middlewareOptions.options = rest;
    this.middlewareOptions = middlewareOptions;
    return new LogstashTransport({ ...rest, refreshTransport: this.refreshTransport.bind(this) });
  }

  refreshTransport() {
    const { maxRetries, timeoutMaxRetries, logger, options, refreshCount, refreshTime } = this.middlewareOptions;
    if (refreshCount <= maxRetries) {
      logger.remove(logger.transports.find(transport => transport.name === "logstashTransport"));
      setTimeout(() => {
        // Update Refresh Count
        this.middlewareOptions = {
          ...this.middlewareOptions,
          refreshCount: refreshCount + 1,
          refreshTime: refreshTime || new Date()
        }
        // Replace Transport
        logger.add(new LogstashTransport({ ...options, refreshTransport: this.refreshTransport.bind(this) }));
        logger.error({
          message:`Logstash Transport Restarted. Lost logs between now and ${this.middlewareOptions.refreshTime}`
        });
      }, timeoutMaxRetries);
    }
  }
}

module.exports = LogstashTransportMiddleware;