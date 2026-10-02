import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ReportCardSubmission, reportCardEndpoint } from '../../shared/report-card';

@Service()
export class ReportCardClient {
  private readonly httpClient = inject(HttpClient);

  submit(submission: ReportCardSubmission): Promise<void> {
    return firstValueFrom(
      this.httpClient.post<void>(reportCardEndpoint, submission, { timeout: 30_000 }),
    );
  }
}
