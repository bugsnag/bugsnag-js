module.exports = () => {
  return {
    onSendError (event) {
      event.context = 'checkout page'
      event.addMetadata('account', { type: 'VIP', verified: true })
      event.addMetadata('account', 'status', "it's complicated")
    }
  }
}
