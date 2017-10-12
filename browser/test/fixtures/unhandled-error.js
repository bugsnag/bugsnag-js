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
  a()
}

go()
