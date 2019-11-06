#!/usr/bin/env node

const commandLineArgs = require('command-line-args')
const { resolve } = require('path')
const { red, yellow } = require('kleur')

const commands = new Map([
  ['add-hook', require('./commands/add-hook')],
  ['help', require('./commands/help')],
  ['init', require('./commands/init')],
  ['insert', require('./commands/insert')],
  ['install', require('./commands/install')],
  ['set-api-key', require('./commands/set-api-key')]
])

// define top-level options
const cliOpts = [
  { name: 'command', defaultOption: true },
  { name: 'help', type: Boolean },
  { name: 'project-root', defaultValue: process.cwd() }
]

const parsedArgs = commandLineArgs(cliOpts, { stopAtFirstUnknown: true })
const argv = parsedArgs._unknown || []

// make project root absolute
parsedArgs['project-root'] = resolve(process.cwd(), parsedArgs['project-root'])

const go = async () => {
  try {
    // `bugsnag-expo --help` works
    if (parsedArgs.help) return await commands.get('help')(argv, parsedArgs)

    // bugsnag-expo <cmd>
    const cmd = commands.get(parsedArgs.command)
    if (cmd) return await cmd(argv, parsedArgs)

    // no command found, maybe nothing was provided?
    process.exitCode = 1

    // print out what was received
    if (parsedArgs.command) console.log(yellow(`\n  Unknown command: ${parsedArgs.command}`))

    // send help
    return await commands.get('help')(argv, parsedArgs)
  } catch (e) {
    console.error(red(`\n  ${e.stack.split('\n').join('\n  ')} \n`))
    process.exitCode = 1
  }
}

go()
