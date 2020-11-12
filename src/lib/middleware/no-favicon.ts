import { RequestHandler } from 'express';

import log from 'lib/log';


export const noFaviconMiddleware = (): RequestHandler => {
  return (req, res, next) => {
    log.info(log.prefix('noFavicon'), `Path: ${req.path}`);
    next();
  };
};
