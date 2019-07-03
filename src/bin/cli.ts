#!/usr/bin/env node

import yargs from 'yargs';

import {ShhArguments} from 'etc/types';
import log from 'lib/log';
import server from 'lib/server';


yargs.command({
  command: '* [secret]',
  describe: 'Run a short-lived local server to quickly share information with others.',
  builder: command => {
    command.positional('secret', {
      description: 'Share the indicated information.',
      required: false,
      type: 'string',
      conflicts: ['file']
    });

    command.option('file', {
      description: 'Share the contents of the indicated file.',
      required: false,
      type: 'string',
      conflicts: ['secret']
    });

    command.alias('f', 'file');

    command.option('stop', {
      description: 'Shut down the server after the first successful request is served.',
      type: 'boolean',
      default: true,
      required: false
    });

    command.alias('s', 'stop');

    command.option('timeout', {
      description: 'Shut down the server after the indicated time has elapsed.',
      type: 'string',
      default: '1 minute',
      required: false
    });

    command.alias('t', 'timeout');

    command.option('public', {
      description: 'Make the server accessible to the public.',
      type: 'boolean',
      default: false
    });

    command.alias('p', 'public');

    command.example('$0 foo', 'Serve the string "foo" on the local LAN for 1 minute or until it is accessed.');
    command.example('$0 --no-stop', 'Serve the string "foo" on the local LAN for 1 minute.');
    command.example('$0 -f foo.txt -p', 'Serve the file "foo.txt" on the local LAN and public Internet for 1 minute.');

    return command;
  },
  handler: async (args: ShhArguments) => {
    try {
      log.silly('args', args);
      await server(args);
    } catch (err) {
      const [message, ...stack] = err.stack.split('\n');
      log.error('', message);
      log.verbose('', stack.join('\n'));
      process.exit(1);
    }
  }
});


yargs.alias('v', 'version');
yargs.alias('h', 'help');

yargs.showHelpOnFail(true, 'See --help for usage instructions.');
yargs.wrap(yargs.terminalWidth());
yargs.version();
yargs.strict();
yargs.help();


// Parse command-line arguments, bail on --help, --version.
export default yargs.argv;
