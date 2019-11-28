#!/usr/bin/env node

import os from 'os';
import cli from '@darkobits/saffron';

import {ShhArguments} from 'etc/types';
import log from 'lib/log';
import server from 'lib/server';


cli.command<ShhArguments>({
  command: '* [secret]',
  description: 'Run a short-lived local server to quickly share information with others.',
  builder: ({command}) => {
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
  handler: async ({argv}) => {
    try {
      log.silly('args', argv);
      await server(argv);
    } catch (err) {
      log.error('', err.message);
      log.verbose('', err.stack.split(os.EOL).slice(1).join(os.EOL));
      process.exit(err.code || 1);
    }
  }
});


cli.init();
