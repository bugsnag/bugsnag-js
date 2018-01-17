module.exports = client =>
  client.app && typeof client.app.releaseStage === 'string'
    ? client.app.releaseStage
    : client.config.releaseStage
