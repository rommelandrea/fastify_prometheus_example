import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';
import FastifyMetrics from 'fastify-metrics';

/**
 * Application server instance.
 *
 * @export
 * @class App
 */
export default class App {
  /**
   * Application server instance.
   *
   * @private
   * @type {fastify.FastifyInstance<Server, IncomingMessage, ServerResponse>}
   * @memberof App
   */
  public app: FastifyInstance<Server, IncomingMessage, ServerResponse>;

  /**
   * Application port number
   *
   * @private
   * @type {string}
   * @memberof App
   */
  private port: number | string;

  /**
   *Creates an instance of App.
   * @memberof App
   */
  constructor() {
    this.port = process.env.PORT || 3000;
    this.app = fastify({
      ignoreTrailingSlash: true,
      logger: {
        level: 'fatal',
      },
    });
    this.config();

    this.start();

    this.app.get('/ping', async (request: FastifyRequest, reply: FastifyReply) => {
      reply
          .header('Content-Type', 'application/json; charset=utf-8')
          .send({
            'success': true,
            'data': 'pong',
          });
    });
  }

  /**
   * Start application server.
   *
   * @memberof App
   */
  public async start() {
    await this.app.listen(this.port as number, '0.0.0.0').catch(console.log);

    this.app.log.info('Server listening on port', this.app.server.address());

    process.on('uncaughtException', console.error);

    process.on('unhandledRejection', console.error);

    // graceful shutdown for processes, and fastify's browser instance
    for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as NodeJS.Signals[]) {
      process.on(signal, async () => {
        process.exit();
      });
    }
  }

  /**
   * Application level configurations
   *
   * @private
   * @memberof App
   */
  private config() {
    if (process.env.NODE_ENV !== 'production') {
      this.app.setErrorHandler(async (err, _req, _res) => {
        console.log(err);
      });
    }

    this.app.addHook('onRequest', (req, res, next) => {
      // remove trailing slash
      if (req.url.endsWith('/') && req.url !== '/') {
        res.raw.writeHead(301, { Location: 'http://' + req.headers['host'] + req.url.slice(0, -1) });
        res.raw.end();
      }

      next();
    });

    this.app.register(FastifyMetrics, {
      endpoint: '/metrics',
      prefix: 'fastify',
    });
  }
}
