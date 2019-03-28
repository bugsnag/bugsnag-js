const { ncp } = require('ncp')
const { mkdir } = require('fs')
const rimraf = require('rimraf')
const { promisify } = require('util')

const prepare = async (fixture) => {
  const tmp = `${__dirname}/../.tmp`

  // ensure tmp directory is empty
  await promisify(rimraf)(tmp)

  // ensure tmp directory exists
  await promisify(mkdir)(tmp)

  // copy in the desired fixture
  const target = `${tmp}/${fixture}`
  await promisify(ncp)(`${__dirname}/../fixtures/${fixture}`, target)

  // give the target path to the caller
  return target
}

module.exports = prepare
