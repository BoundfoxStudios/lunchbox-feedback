import {
  mergeApplicationConfig,
  ApplicationConfig,
  inject,
  provideAppInitializer,
  TransferState,
} from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { teacherNameKey } from './teacher-name';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Read on every render so the name stays out of the public repository; TransferState hands it
    // to the browser, which would otherwise hydrate with the neutral copy.
    provideAppInitializer(() => {
      inject(TransferState).set(teacherNameKey, process.env['TEACHER_NAME']?.trim() || null);
    }),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
