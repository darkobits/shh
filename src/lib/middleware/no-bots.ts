import crawlerUserAgents from 'crawler-user-agents';
import { Request, RequestHandler } from 'express';

import log from 'lib/log';


/**
 * @private
 *
 * Returns `true` if the provided Request was initiated by a well-known bot or
 * crawler.
 */
function isBot(req: Request) {
  for (const entry of crawlerUserAgents) {
    const userAgent = req.headers['user-agent'];
    if (userAgent && new RegExp(entry.pattern).test(userAgent)) {
      return true;
    }
  }

  return false;
}


/**
 * Returns an Express middleware function that will block incoming connections
 * from known bots.
 */
export const noBotsMiddleware = (): RequestHandler => {
  return (req, res, next) => {
    if (isBot(req)) {
      log.verbose(log.prefix('noBots'), `Denied request to bot ${log.chalk.bold(req.headers['user-agent'] as string)}`);
      res.destroy();
    }

    next();
  };
};
