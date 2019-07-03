import http from 'http';
import path from 'path';

import express from 'express';
import fs from 'fs-extra';
import getPort from 'get-port';
import ngrok from 'ngrok';
import uuid from 'uuid/v4';

import {ShhArguments} from 'etc/types';
import log from 'lib/log';
import {
  getLocalIpAddresses,
  getRemoteHost,
  loadData,
  parseTime,
  parseUserAgent,
  isBot
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


/**
 * Shut-down procedure.
 */
async function stopServer(httpServer: http.Server) {
  await ngrok.disconnect();
  httpServer.close();
  log.info('', 'Exiting.');
  process.exit(0);
}


export default async function shh(args: ShhArguments) {
  try {
    const [port, bundle] = await Promise.all([
      // Find random local unused port.
      getPort(),
      // Load client-side bundle.
      fs.readFile(path.resolve(__dirname, '..', 'static', 'bundle.js'), 'utf8'),
      // Load data initially so we can fail fast if there are errors.
      loadData(args)
    ]);

    const timeout = parseTime(args.timeout);

    // Assigned when we start the server.
    let httpServer: http.Server;

    // Generate a random string that will serve as our route.
    const randomPath = uuid().replace(/-/g, '');

    // Add an entry for each private IP address.
    const urls = getLocalIpAddresses().map(ipAddress => `http://${ipAddress}:${port}/${randomPath}`);

    // Create app.
    const app = express();


    // ----- Define Routes -----------------------------------------------------

    // If the request came from a bot or crawler, do nothing.
    app.use((req, res, next) => {
      if (isBot(req)) {
        log.verbose('', `Denied request to bot ${log.chalk.bold(req.headers['user-agent'] as string)}`);
        res.destroy();
      }

      next();
    });

    // Browsers typically request this file, and we don't want it to get handled
    // by the catch-all handler below.
    app.get('/favicon.ico', (req, res, next) => {
      res.destroy();
      next();
    });

    // Primary route handler.
    app.get(`/${randomPath}`, async (req, res) => {
      try {
        if (args.stop === true && httpServer) {
          res.on('finish', async () => {
            await stopServer(httpServer);
          });
        }

        const data = await loadData(args);

        res.header('Connection', 'close');

        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>&#xfeff;</title>
              <link href="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" rel="icon" type="image/x-icon">
              <link href="https://fonts.googleapis.com/css?family=Roboto+Mono:300" rel="stylesheet">
              <link href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" rel="stylesheet" integrity="sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf" crossorigin="anonymous">
              </head>
              <body>
                <div id="root"></div>
                <script type="application/json" id="data">${JSON.stringify({data, stop: args.stop})}</script>
                <script type="text/javascript">${bundle}</script>
              </body>
          </html>
        `);

        const remoteHost = getRemoteHost(req);
        log.info('', `Request served to host: ${log.chalk.bold.green(remoteHost)} ${log.chalk.dim(`(${parseUserAgent(req)})`)}`);
      } catch (err) {
        log.error('', err.message);
        res.destroy();
      }
    });

    // Deny all other requests.
    app.all('*', (req, res, next) => {
      const remoteHost = getRemoteHost(req);
      log.info('', `Request denied from host ${log.chalk.bold.red(remoteHost)}.`);
      res.destroy();
      next();
    });


    // ----- (Optional) Create Tunnel ------------------------------------------

    if (args.public === true) {
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
        await stopServer(httpServer);
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
    if (args.stop === true && timeout.number === Infinity) {
      log.info('', `Server will shut-down after ${log.chalk.yellow('first request')}.`);
    } else if (args.stop === true && timeout.number !== Infinity) {
      log.info('', `Server will shut-down after ${log.chalk.yellow(timeout.string)} or ${log.chalk.yellow('first request')}.`);
    } else if (args.stop === false && timeout.number !== Infinity) {
      log.info('', `Server will shut-down after ${log.chalk.yellow(timeout.string)}.`);
    } else if (args.stop === false && timeout.number === Infinity) {
      log.warn('', `Server will remain online ${log.chalk.red.bold('indefinitely')}.`);
    }
  } catch (err) {
    log.error('', err.message);
    log.verbose('', err.stack.split('\n').slice(1).join('\n'));
    process.exit(1);
  }
}
