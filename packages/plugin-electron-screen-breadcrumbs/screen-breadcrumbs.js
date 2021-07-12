const BREADCRUMB_STATE = 'state'

module.exports = screen => {
  const seenIds = []

  const anonymiseId = id => {
    if (!seenIds.includes(id)) {
      seenIds.push(id)
    }

    return seenIds.indexOf(id)
  }

  const anonymise = display => Object.assign({}, display, { id: anonymiseId(display.id) })

  return {
    load (client) {
      if (!client._isBreadcrumbTypeEnabled(BREADCRUMB_STATE)) {
        return
      }

      screen.on('display-added', (_event, display) => {
        const metadata = anonymise(display)

        client.leaveBreadcrumb(
          `Display ${metadata.id} added`,
          metadata,
          BREADCRUMB_STATE
        )
      })

      screen.on('display-removed', (_event, display) => {
        const metadata = anonymise(display)

        client.leaveBreadcrumb(
          `Display ${metadata.id} removed`,
          metadata,
          BREADCRUMB_STATE
        )
      })

      screen.on('display-metrics-changed', (_event, display, changedMetrics) => {
        const metadata = anonymise(display)
        const changes = determineChanges(changedMetrics)

        client.leaveBreadcrumb(
          `Display ${metadata.id} ${changes} changed`,
          metadata,
          BREADCRUMB_STATE
        )
      })
    }
  }
}

function determineChanges (changedMetrics) {
  return changedMetrics.map(metricToName).join(', ').replace(/,(?=[^,]*$)/, ' and')
}

const metricNames = new Map([
  ['workArea', 'work area'],
  ['scaleFactor', 'scale factor']
])

function metricToName (metric) {
  return metricNames.get(metric) || metric
}
