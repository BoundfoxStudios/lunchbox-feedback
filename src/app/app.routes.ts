import { Routes } from '@angular/router';
import { ReportCardPage } from './report-card/report-card-page';

export const routes: Routes = [
  { path: '', component: ReportCardPage },
  { path: '**', redirectTo: '' },
];
