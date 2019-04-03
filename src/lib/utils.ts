import os from 'os';
import path from 'path';

import {Request} from 'express';
import fs from 'fs-extra';
import ms from 'ms';
import UAParser from 'ua-parser-js';

import log from 'lib/log';
import {ShhArguments} from '../etc/types';


/**
 * If we were passed the -f or --file option, load the indicated file. Otherwise
 * use the raw input provided as the first command line argument.
 */
export async function loadData(argv: ShhArguments) {
  try {
    if (argv.file) {
      return await fs.readFile(path.resolve(argv.file), 'utf-8');
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`File ${log.chalk.green(argv.file as string)} does not exist or is not readable.`);
    }

    throw err;
  }

  const rawData = argv._[0];

  if (!rawData) {
    throw new Error('No data provided.');
  }

  return rawData;
}


/**
 * Returns an array of all local IP addresses for the current machine.
 */
export function getLocalIpAddresses() {
  const addresses: Array<string> = [];

  Object.values(os.networkInterfaces()).forEach(iface => {
    iface.forEach(ifaceInfo => {
      if (ifaceInfo.family === 'IPv4' && ifaceInfo.address !== '127.0.0.1') {
        addresses.push(ifaceInfo.address);
      }
    });
  });

  return addresses;
}


/**
 * If an X-Forwarded-For header is present in the provided headers object,
 * returns it. Otherwise, returns the Host header.
 */
export function getHostHeader(headers: Request['headers']) {
  if (headers['x-forwarded-for']) {
    // @ts-ignore
    return headers['x-forwarded-for'].toString();
  }

  if (headers.host) {
    return headers.host.toString();
  }

  return 'unknown';
}


/**
 * Accepts either a string or a number and returns a number.
 */
export function parseTime(value: string | boolean) {
  if (value === 'Infinity' || value === false) {
    return {string: 'indefinitely', number: Infinity};
  }

  if (value === true) {
    throw new Error(`Invalid timeout: ${log.chalk.yellow('true')}`);
  }

  if (value.match(/\D/g)) {
    // Value was non-numeric (ie: "5 minutes").
    return {
      string: value,
      number: ms(value)
    };
  }

  // Value was numeric (ie: "1500").
  return {
    string: ms(parseInt(value, 10)),
    number: parseInt(value, 10)
  };
}


/**
 * Provided a request object, returns a string describing the browser and
 * operating system of the client.
 */
export function parseUserAgent(req: Request) {
  if (!req.headers['user-agent']) {
    return 'unknown user agent';
  }

  const parser = new UAParser(req.headers['user-agent']);
  const browser = parser.getBrowser();
  const system = parser.getOS();
  let browserStr: string;

  if (browser.version) {
    const majorVersion = browser.version.split('.')[0];
    browserStr = `${browser.name} ${majorVersion}`;
  } else {
    browserStr = browser.name || 'unknown browser';
  }

  let systemStr: string;

  if (system.name && system.version) {
    systemStr = `${system.name} ${system.version}`;
  } else {
    systemStr = 'unknown OS';
  }

  return `${browserStr}, ${systemStr}`;
}
