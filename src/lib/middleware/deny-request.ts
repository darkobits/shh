import { RequestHandler } from 'express';

import { getRemoteHost } from 'lib/utils';
import log from 'lib/log';


/**
 * Denies the incoming request.
 */
export const denyRequestMiddleware = (): RequestHandler => {
  return (req, res, next) => {
    const remoteHost = getRemoteHost(req);
    log.info(log.prefix('denyRequest'), `${req.method} request for ${log.chalk.green(req.path)} denied from host ${log.chalk.bold.red(remoteHost)}.`);
    req.destroy();
    next();
  };
};
