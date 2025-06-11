module.exports = async c => {
  try {
    const { getConnInfo } = await import('@hono/node-server/conninfo')
    if (getConnInfo) {
      return getConnInfo(c)
    }
    return null
  } catch {
    return null
  }
}
