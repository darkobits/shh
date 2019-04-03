#!/usr/bin/env node

import yargs from 'yargs';

import {ShhArguments} from '../etc/types';
import log from 'lib/log';
import server from 'lib/server';

yargs.usage('Run a short-lived local server to quickly share information with others.');

yargs.example('$0 foo', 'Serve the string "foo" on the local LAN for 1 minute or until it is accessed.');
yargs.example('$0 --no-stop', 'Serve the string "foo" on the local LAN for 1 minute.');
yargs.example('$0 -f foo.txt -p', 'Serve the file "foo.txt" on the local LAN and public Internet for 1 minute.');

yargs.option('file', {
  description: 'Serve the contents of the indicated file.',
  required: false,
  type: 'string'
});

yargs.alias('f', 'file');

yargs.option('stop', {
  description: 'Shut down the server after the first successful request is served.',
  type: 'boolean',
  default: true,
  required: false
});

yargs.alias('s', 'stop');

yargs.option('timeout', {
  description: 'Shut down the server after the indicated time has elapsed.',
  type: 'string',
  default: '1 minute',
  required: false
});

yargs.alias('t', 'timeout');

yargs.option('public', {
  description: 'Make the server accessible to the public.',
  type: 'boolean',
  default: false
});

yargs.alias('p', 'public');

yargs.alias('v', 'version');
yargs.alias('h', 'help');

yargs.showHelpOnFail(true, 'See --help for usage instructions.');
yargs.wrap(yargs.terminalWidth());
yargs.version();
yargs.strict();
yargs.help();


async function cli() {
  try {
    // Parse command-line arguments, bail on --help, --version.
    // @ts-ignore
    const argv: ShhArguments = yargs.argv;
    log.silly('args', argv);

    await server(argv);
  } catch (err) {
    log.error('', err.message);
    log.verbose('', err.stack.split('\n').slice(1).join('\n'));
    process.exit(1);
  }
}


export default cli();
