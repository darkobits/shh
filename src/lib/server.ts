import http from 'http';
import path from 'path';

import ejs from 'ejs';
import express from 'express';
import getPort from 'get-port';
import ngrok from 'ngrok';
import uuid from 'uuid/v4';

import {ShhArguments} from '../etc/types';
import log from 'lib/log';
import {
  getHostHeader,
  getLocalIpAddresses,
  loadData,
  parseTime,
  parseUserAgent
} from 'lib/utils';


/**
 * Starts an Express app on the indicated port and returns a Promise that
 * resolves with the HTTP server instance when it is ready to accept
 * connections.
 */
async function startExpressApp(app: express.Application, port: number) {
  return new Promise<http.Server>(resolve => {
    const httpServer = app.listen(port, () => {
      resolve(httpServer);
    });
  });
}


export default async function server(argv: ShhArguments) {
  try {
    const [port] = await Promise.all([
      // Find random local unused port.
      getPort(),
      // Load data initially so we can fail fast if there are errors.
      loadData(argv)
    ]);

    const timeout = parseTime(argv.timeout);

    // Assigned when we start the server.
    let httpServer: http.Server;

    // Generate a random string that will serve as our route.
    const randomPath = uuid().replace(/-/g, '');

    // Add an entry for each private IP address.
    const urls = getLocalIpAddresses().map(ipAddress => `http://${ipAddress}:${port}/${randomPath}`);

    // Create app.
    const app = express();

    // Set up view engine.
    app.set('views', path.resolve(__dirname, '..', 'views'));
    app.set('view engine', 'ejs');
    app.set('ejs', ejs);

    // Define shut-down handler.
    const stopServer = async () => {
      if (httpServer) {
        await ngrok.disconnect();
        httpServer.close();
        log.info('', 'Exiting.');
        process.exit(0);
      }
    };

    // Primary route handler.
    app.get(`/${randomPath}`, async (req, res) => {
      try {
        const data = await loadData(argv);
        const host = getHostHeader(req.headers);

        res.header('Connection', 'close');
        res.render('index', {data, stop: argv.stop});

        log.info('', `Request served to host: ${log.chalk.bold.green(host)} ${log.chalk.dim(`(${parseUserAgent(req)})`)}`);

        if (argv.stop === true && httpServer) {
          await stopServer();
        }
      } catch (err) {
        log.error('', err.message);
        req.destroy();
      }
    });

    // Browsers typically request this file, and we don't want it to get handled
    // by the catch-all handler below.
    app.get('/favicon.ico', (req, res) => {
      res.send('');
    });

    // Deny all other requests.
    app.all('*', (req, res) => {
      const host = getHostHeader(req.headers);
      log.info('', `Request denied from host ${log.chalk.bold.red(host)}.`);
      res.destroy();
    });


    // ----- (Optional) Create Tunnel ------------------------------------------

    if (argv.public === true) {
      // Create tunnel for public server.
      const ngrokUrl = await ngrok.connect({
        proto: 'http',
        addr: port,
        // auth: 'user:pass'
      });

      // Add an entry for the public tunnel address.
      urls.push(`${ngrokUrl}/${randomPath}`);
    }


    // ----- (Optional) Set Auto Shut-Down Timeout -----------------------------

    if (timeout.number !== Infinity) {
      setTimeout(async () => {
        log.info('', log.chalk.yellow('Timeout reached.'));
        await stopServer();
      }, timeout.number);
    }


    // ----- Start Server ------------------------------------------------------

    httpServer = await startExpressApp(app, port);

    // Log all available URLs.
    if (urls.length === 1) {
      log.info('', `Server available at: ${log.chalk.cyan(urls[0])}`);
    } else {
      log.info('', 'Server available at:');
      urls.forEach(url => {
        log.info('', `- ${log.chalk.cyan(url)}`);
      });
    }

    // Log auto shut-down conditions.
    if (argv.stop === true && timeout.number === Infinity) {
      log.info('', `Server will shut-down after ${log.chalk.yellow('first request')}.`);
    } else if (argv.stop === true && timeout.number !== Infinity) {
      log.info('', `Server will shut-down after ${log.chalk.yellow(timeout.string)} or ${log.chalk.yellow('first request')}.`);
    } else if (argv.stop === false && timeout.number !== Infinity) {
      log.info('', `Server will shut-down after ${log.chalk.yellow(timeout.string)}.`);
    } else if (argv.stop === false && timeout.number === Infinity) {
      log.warn('', `Server will remain online ${log.chalk.red.bold('indefinitely')}.`);
    }
  } catch (err) {
    log.error('', err.message);
    log.verbose('', err.stack.split('\n').slice(1).join('\n'));
    process.exit(1);
  }
}
