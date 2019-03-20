#!/usr/bin/env node

const commandLineArgs = require('command-line-args')

const commands = new Map([
  [ 'add-hook', require('./commands/add-hook') ],
  [ 'help', require('./commands/help') ],
  [ 'init', require('./commands/init') ],
  [ 'insert', require('./commands/insert') ],
  [ 'install', require('./commands/install') ],
  [ 'set-api-key', require('./commands/set-api-key') ]
])

// define top-level options
const cliOpts = [
  { name: 'command', defaultOption: true },
  { name: 'verbose', alias: 'v', type: Boolean },
  { name: 'help', type: Boolean },
  { name: 'project-root', defaultValue: process.cwd() }
]

const parsedArgs = commandLineArgs(cliOpts, { stopAtFirstUnknown: true })
const argv = parsedArgs._unknown || []

const go = () => {
  // `bugsnag-expo --help` works
  if (parsedArgs.help) return commands.get('help')(argv, parsedArgs)

  // bugsnag-expo <cmd>
  const cmd = commands.get(parsedArgs.command)
  if (cmd) return cmd(argv, parsedArgs)

  // no command found, maybe nothing was provided?
  process.exitCode = 1
  // print out what was received
  if (parsedArgs.command) console.log(`Unknown command: ${parsedArgs.command}`)
  // send help
  return commands.get('help')(argv, parsedArgs)
}

go()
