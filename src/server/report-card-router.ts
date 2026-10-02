import express, { type NextFunction, type Request, type Response, type Router } from 'express';
import { reportCardEndpoint } from '../shared/report-card';
import { createDiscordMessage } from './discord-message';
import { parseReportCardSubmission } from './report-card-validation';

export interface ReportCardRouterDependencies {
  deliver: (message: FormData) => Promise<void>;
  now: () => Date;
}

export function createReportCardRouter(dependencies: ReportCardRouterDependencies): Router {
  const router = express.Router();

  router.post(reportCardEndpoint, express.json({ limit: '1mb' }), async (request, response) => {
    const reportCard = parseReportCardSubmission(request.body);
    if (reportCard === null) {
      response.status(400).json({ error: 'invalid-report-card' });
      return;
    }
    const message = createDiscordMessage(reportCard, dependencies.now());
    try {
      await dependencies.deliver(message);
      response.status(204).end();
    } catch (error) {
      console.error('Discord delivery failed', error);
      response.status(502).json({ error: 'delivery-failed' });
    }
  });

  router.all('/api/{*path}', (_request, response) => {
    response.status(404).json({ error: 'not-found' });
  });

  router.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const status = clientErrorStatus(error);
    if (status === null) {
      console.error('Report card request failed', error);
      response.status(500).json({ error: 'internal-error' });
      return;
    }
    response.status(status).json({ error: 'invalid-request' });
  });

  return router;
}

function clientErrorStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return null;
  }
  const { status } = error;
  return typeof status === 'number' && status >= 400 && status < 500 ? status : null;
}
