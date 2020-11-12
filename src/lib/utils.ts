import os from 'os';
import path from 'path';

import { Request } from 'express';
import fs from 'fs-extra';
import ms from 'ms';
import { UAParser } from 'ua-parser-js';

import log from 'lib/log';
import { ShhArguments } from '../etc/types';


/**
 * If we were passed the -f or --file option, load the indicated file. Otherwise
 * use the raw input provided as the first command line argument.
 */
export async function loadData(args: ShhArguments) {
  try {
    if (args.file) {
      return await fs.readFile(path.resolve(args.file), 'utf-8');
    }

    const rawData = args.secret;

    if (!rawData) {
      throw new Error('No data provided.');
    }

    return rawData;
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`File ${log.chalk.green(args.file as string)} does not exist or is not readable.`);
    }

    throw err;
  }
}


/**
 * Returns an array of all local IP addresses for the current machine.
 */
export function getLocalIpAddresses() {
  const addresses: Array<string> = [];

  Object.values(os.networkInterfaces()).forEach(networkInterface => {
    if (!networkInterface) return;

    networkInterface.forEach(({ address, family }) => {
      if (family === 'IPv4' && address !== '127.0.0.1') {
        addresses.push(address);
      }
    });
  });

  return addresses;
}


/**
 * If an X-Forwarded-For header is present in the provided request, returns it.
 * Otherwise, returns the Host header.
 */
export function getRemoteHost(req: Request) {
  if (req.headers['x-forwarded-for']) {
    // @ts-ignore
    return req.headers['x-forwarded-for'].toString();
  }

  if (req.connection.remoteAddress) {
    return req.connection.remoteAddress;
  }

  return 'unknown';
}


/**
 * Accepts either a string or a number representing an interval of time and
 * returns an object with a string and numerical representation of the interval.
 */
export function parseTime(value: string | boolean) {
  try {
    let asString: string;
    let asNumber: number;

    const expandNotations = (str: string) => {
      const matches = /^(\d+)(\D+)$/g.exec(str);

      if (!matches) {
        throw new Error(`Invalid timestamp: ${str}`);
      }

      const [, num, unit] = matches;

      switch (unit) {
        case 'ms':
          return `${num} millisecond${num === '1' ? '' : 's'}`;
        case 's':
          return `${num} second${num === '1' ? '' : 's'}`;
        case 'm':
          return `${num} minute${num === '1' ? '' : 's'}`;
        case 'h':
          return `${num} hour${num === '1' ? '' : 's'}`;
        case 'd':
          return `${num} day${num === '1' ? '' : 's'}`;
        default:
          throw new Error(`Invalid string: ${str}`);
      }
    };

    if (value === 'Infinity' || value === false) {
      return {string: 'indefinitely', number: Infinity};
    }

    if (value === true) {
      throw new Error(`Invalid timeout: ${log.chalk.yellow('true')}`);
    }

    if (value.match(/\D/g)) {
      // Value was non-numeric (ie: "5 minutes").
      asNumber = ms(value);
      asString = expandNotations(ms(asNumber));
    } else {
      // Value was numeric (ie: "1500").
      asNumber = Number.parseInt(value, 10);
      asString = expandNotations(ms(asNumber));
    }

    return {number: asNumber, string: asString};
  } catch  {
    throw new Error(`Invalid time: ${value}`);
  }
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

  if (browser.name && browser.version) {
    const majorVersion = browser.version.split('.')[0];
    browserStr = `${browser.name} ${majorVersion}`;
  } else {
    browserStr = 'unknown browser';
  }

  const systemStr = system.name && system.version ? `${system.name} ${system.version}` : 'unknown OS';

  return `${browserStr}, ${systemStr}`;
}
