function a () {
  b()
}

function b () {
  c()
}

function c () {
  something_bad() // eslint-disable-line
}

function go () {
  try {
    a()
  } catch (e) {
    window.bugsnag.notify(e)
  }
}

go()
