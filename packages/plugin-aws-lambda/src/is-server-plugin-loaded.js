const serverPluginNames = ['express', 'koa', 'restify']

module.exports = client => serverPluginNames.some(name => client.getPlugin(name))
