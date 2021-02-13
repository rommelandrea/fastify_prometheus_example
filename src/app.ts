import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';
import FastifyMetrics from 'fastify-metrics';
import pino from 'pino';
import dotenv from 'dotenv';

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
    dotenv.config();

    this.port = process.env.PORT || 3000;

    this.app = fastify({
      ignoreTrailingSlash: true,
      logger: pino({
        level: process.env.LOG_LEVEL || 'debug',
        messageKey: 'message',
      }),
    });

    // Import configurations
    this.config();

    // Import routes
    this.routes();
  }

  /**
   * Start application server.
   *
   * @memberof App
   */
  public async start() {
    await this.app.listen(this.port as number, process.env.HOST || '0.0.0.0').catch(console.log);

    // this.app.log.info('Server listening on port', this.app.server.address());

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
        this.app.log.error(err.message);
      });
    }
    this.app.register(FastifyMetrics, {
      endpoint: '/metrics',
      prefix: 'fastify',
    });
  }

  /**
   * Simple route to test Fastify
   *
   * @private
   * @memberof App
   */
  private routes() {
    this.app.get('/ping', async (request: FastifyRequest, reply: FastifyReply) => {
      reply
          .header('Content-Type', 'application/json; charset=utf-8')
          .send({
            'success': true,
            'data': 'pong',
          });
    });
  }
}
