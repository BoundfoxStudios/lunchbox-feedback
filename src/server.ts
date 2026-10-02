import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { postToDiscord } from './server/discord-webhook';
import { createReportCardRouter } from './server/report-card-router';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine({
  trustProxyHeaders: ['x-forwarded-for', 'x-forwarded-proto'],
});

app.use(createReportCardRouter({ deliver: postToDiscord, now: () => new Date() }));

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((request, response, next) => {
  angularApp
    .handle(request)
    .then((renderedResponse) =>
      renderedResponse ? writeResponseToNodeResponse(renderedResponse, response) : next(),
    )
    .catch(next);
});

// Passenger (Plesk) runs the app via its node-loader.js (argv[1]), so isMainModule is false.
if (isMainModule(import.meta.url) || process.env['pm_id'] || process.env['IN_PASSENGER'] === '1') {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
