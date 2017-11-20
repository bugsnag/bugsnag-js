function go () {
  window.bugsnag.notify({ name: 'UnexpectedThing', message: '666 was not an expected outcome' })
}

go()
