import {
  Component,
  ElementRef,
  TransferState,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormField, FormRoot, form, maxLength, required } from '@angular/forms/signals';
import { formatBerlinDay } from '../../shared/berlin-day';
import {
  Grade,
  calculateAverage,
  describeAverage,
  formatAverage,
  gradeWords,
} from '../../shared/grading';
import {
  ReportCardSubmission,
  SubjectId,
  maximumTextLength,
  subjects,
} from '../../shared/report-card';
import { teacherNameKey } from '../teacher-name';
import { GradeStamps } from './grade-stamps';
import { PhotoPolaroid } from './photo-polaroid';
import { ReportCardClient } from './report-card-client';
import { Sunflower } from './sunflower';

interface ReportCardDraft {
  grades: Record<SubjectId, Grade | null>;
  wishes: string;
  message: string;
  photo: string | null;
}

@Component({
  selector: 'app-report-card-page',
  imports: [FormField, FormRoot, GradeStamps, PhotoPolaroid, Sunflower],
  templateUrl: './report-card-page.html',
})
export class ReportCardPage {
  private readonly reportCardClient = inject(ReportCardClient);
  private readonly sentHeading = viewChild<ElementRef<HTMLHeadingElement>>('sentHeading');

  protected readonly today = formatBerlinDay(new Date());
  protected readonly teacherName = inject(TransferState).get(teacherNameKey, null);
  protected readonly subjects = subjects;
  protected readonly gradeWords = gradeWords;
  protected readonly status = signal<'idle' | 'sent' | 'failed'>('idle');
  protected readonly nudgeVisible = signal(false);

  private readonly reportCardDraft = signal<ReportCardDraft>({
    grades: { taste: null, portion: null, presentation: null },
    wishes: '',
    message: '',
    photo: null,
  });

  protected readonly reportCardForm = form(
    this.reportCardDraft,
    (path) => {
      required(path.grades.taste);
      required(path.grades.portion);
      required(path.grades.presentation);
      maxLength(path.wishes, maximumTextLength);
      maxLength(path.message, maximumTextLength);
    },
    {
      submission: {
        action: async (field) => {
          this.status.set('idle');
          const { grades, wishes, message, photo } = field().value();
          try {
            await this.reportCardClient.submit({
              grades: grades as ReportCardSubmission['grades'],
              wishes: wishes.trim(),
              message: message.trim(),
              photo,
            });
            this.status.set('sent');
          } catch {
            this.status.set('failed');
          }
        },
        onInvalid: () => this.nudgeVisible.set(true),
      },
    },
  );

  private readonly ratedGrades = computed(() => {
    const grades = this.reportCardForm.grades().value();
    return subjects
      .map((subject) => grades[subject.id])
      .filter((grade): grade is Grade => grade !== null);
  });
  private readonly average = computed(() => calculateAverage(this.ratedGrades()));
  protected readonly averageText = computed(() => {
    const average = this.average();
    return average === null ? '–' : formatAverage(average);
  });
  protected readonly averageWord = computed(() => {
    const average = this.average();
    return average === null ? 'noch offen' : describeAverage(average);
  });
  protected readonly allRated = computed(() => this.ratedGrades().length === subjects.length);

  constructor() {
    afterRenderEffect({
      write: () => this.sentHeading()?.nativeElement.focus(),
    });
  }
}
