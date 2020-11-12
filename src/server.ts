import http from 'http';
import path from 'path';

import express from 'express';
import fs from 'fs-extra';
import getPort from 'get-port';
import ngrok from 'ngrok';
import {v4 as uuid} from 'uuid';

import { ShhArguments } from 'etc/types';
import log from 'lib/log';
import { noBotsMiddleware } from 'lib/middleware/no-bots';
import { noFaviconMiddleware } from 'lib/middleware/no-favicon';
import { denyRequestMiddleware } from 'lib/middleware/deny-request';
import {
  getLocalIpAddresses,
  getRemoteHost,
  loadData,
  parseTime,
  parseUserAgent
} from 'lib/utils';


/**
 * Resolved absolute path to client-side assets.
 */
const CLIENT_PATH = path.resolve(__dirname, '..', 'client');


// eslint-disable-next-line @typescript-eslint/no-misused-promises
export default async (args: ShhArguments) => new Promise(async (resolveMain, rejectMain) => {
  /**
   * @private
   *
   * Script tag in the client's index.html where we will inject data.
   */
  const injectTokens = ['<script type="application/json" id="data">', '</script>'];


  /**
   * @private
   *
   * Parsed shutdown timeout.
   */
  const timeout = parseTime(args.timeout);


  /**
   * @private
   *
   * HTTP server instance.
   */
  let httpServer: http.Server;


  /**
   * @private
   *
   * Randomly-generated path we will serve on.
   */
  const randomPath = uuid().replace(/-/g, '');


  /**
   * @private
   *
   * Express app instance.
   */
  const app = express();


  /**
   * @private
   *
   * Random high port to run the server on.
   */
  const port = await getPort();


  /**
   * @private
   *
   * Client template that will serve our React app with injected data.
   */
  const indexHtml = await fs.readFile(path.resolve(CLIENT_PATH, 'index.html'), 'utf-8');


  /**
   * @private
   *
   * List of all private and public URLs that the server will be accessible at.
   */
  const urls = getLocalIpAddresses().map(ipAddress => `http://${ipAddress}:${port}/${randomPath}`);


  /**
   * @private
   *
   * Starts an Express app on the indicated port and returns a Promise that
   * resolves with the HTTP server instance when it is ready to accept
   * connections.
   */
  const startServer = async (app: express.Application, port: number) => {
    return new Promise<http.Server>(resolve => {
      // Optimistically load the file/data the user provided and fail early if
      // there is a problem.
      void loadData(args).catch(err => {
        rejectMain(new Error(`Failed to load data: ${err.message}`));
      });

      httpServer = app.listen(port, () => {
        console.log('Should be listening on port', port);
        resolve();
      });
    });
  };


  /**
   * @private
   *
   * Shut-down procedure.
   */
  const stopServer = async (httpServer: http.Server) => {
    log.verbose(log.prefix('stopServer'), 'Shutting down.');

    await ngrok.disconnect();

    // This ensures any outstanding requests the client made have finished.
    setTimeout(() => {
      httpServer.close();
      resolveMain();
    }, 1000);
  };


  // ----- Define Middleware & Routes ------------------------------------------

  app.use(noBotsMiddleware());
  app.use(noFaviconMiddleware());

  app.get(`/${randomPath}`, async (req, res) => {
    log.info('main handler!');
    const remoteHost = getRemoteHost(req);

    // If configured to do so, shut down the server when this request finishes.
    if (args.stop && httpServer) {
      res.on('finish', () => {
        log.info('', `Request served to host: ${log.chalk.bold.green(remoteHost)} ${log.chalk.dim(`(${parseUserAgent(req)})`)}`);

        if (httpServer) {
          void stopServer(httpServer);
        }
      });
    }

    // Prevent keep-alive connections.
    res.header('Connection', 'close');

    // Load data and inject it into our HTML template.
    const data = await loadData(args);
    const [pre, post] = injectTokens;

    res.status(200).send(indexHtml.replace(
      [pre, post].join(''),
      [pre, JSON.stringify({data, stop: args.stop}), post].join('')
    ));
  });

  // Serve all files other than index.html from the client root.
  app.use(express.static(CLIENT_PATH, { index: false }));

  // Deny all other requests.
  app.use(denyRequestMiddleware());


  // ----- (Optional) Create Tunnel ------------------------------------------

  if (args.public) {
    // Create tunnel for public server.
    const ngrokUrl = await ngrok.connect({
      proto: 'http',
      addr: port
      // auth: 'user:pass'
    });

    // Add an entry for the public tunnel address.
    urls.push(`${ngrokUrl}/${randomPath}`);
  }


  // ----- (Optional) Set Auto Shut-Down Timeout -----------------------------

  if (timeout.number !== Infinity) {
    setTimeout(() => {
      log.info('', log.chalk.yellow('Timeout reached.'));
      if (httpServer) {
        void stopServer(httpServer);
      }
    }, timeout.number);
  }


  // ----- Start Server ------------------------------------------------------

  await startServer(app, port);

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
  if (args.stop && timeout.number === Infinity) {
    log.info('', `Server will shut-down after ${log.chalk.yellow('first request')}.`);
  } else if (args.stop && timeout.number !== Infinity) {
    log.info('', `Server will shut-down after ${log.chalk.yellow(timeout.string)} or ${log.chalk.yellow('first request')}.`);
  } else if (!args.stop && timeout.number !== Infinity) {
    log.info('', `Server will shut-down after ${log.chalk.yellow(timeout.string)}.`);
  } else if (!args.stop && timeout.number === Infinity) {
    log.warn('', `Server will remain online ${log.chalk.red.bold('indefinitely')}.`);
  }
});
