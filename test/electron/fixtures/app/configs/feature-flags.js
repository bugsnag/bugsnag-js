module.exports = () => {
  return {
    featureFlags: [
      { name: 'from main config 1', variant: '1234' },
      { name: 'from main config 2' }
    ]
  }
}
