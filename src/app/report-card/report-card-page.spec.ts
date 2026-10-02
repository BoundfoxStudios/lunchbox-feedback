import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TransferState } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Grade, gradeWords } from '../../shared/grading';
import { teacherNameKey } from '../teacher-name';
import { ReportCardPage } from './report-card-page';

describe('ReportCardPage', () => {
  let fixture: ComponentFixture<ReportCardPage>;
  let httpTesting: HttpTestingController;
  let page: HTMLElement;

  const textElement = (text: string) =>
    [...page.querySelectorAll('span, p, h2')].find(
      (element) => element.textContent?.trim() === text,
    );
  const leafTexts = (element: Element | null | undefined) =>
    [...(element?.querySelectorAll('*') ?? [])]
      .filter((descendant) => descendant.childElementCount === 0)
      .map((descendant) => descendant.textContent?.trim());
  const submitButton = () => page.querySelector<HTMLButtonElement>('button[type="submit"]')!;

  const stamp = (subject: string, value: Grade) =>
    page
      .querySelector(`[role="group"][aria-labelledby="${textElement(subject)!.id}"]`)!
      .querySelector<HTMLButtonElement>(
        `button[aria-label="Note ${value} – ${gradeWords[value]}"]`,
      )!;

  async function grade(subject: string, value: Grade): Promise<void> {
    stamp(subject, value).click();
    await fixture.whenStable();
  }

  async function gradeAllSubjects(): Promise<void> {
    await grade('Geschmack', 1);
    await grade('Portionsgröße', 2);
    await grade('Optik & Anrichtung', 2);
  }

  async function type(label: string, text: string): Promise<void> {
    const textarea = textElement(label)!.closest('label')!.querySelector('textarea')!;
    textarea.value = text;
    textarea.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function renderPage(): Promise<void> {
    fixture = TestBed.createComponent(ReportCardPage);
    page = fixture.nativeElement;
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [ReportCardPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    await renderPage();
  });

  afterEach(() => httpTesting.verify());

  it('shows each grade word in its subject header and the average with a comma and its word after grading all subjects', async () => {
    await gradeAllSubjects();

    expect(leafTexts(textElement('Geschmack')?.parentElement)).toEqual(['Geschmack', 'sehr gut']);
    expect(leafTexts(textElement('Portionsgröße')?.parentElement)).toEqual([
      'Portionsgröße',
      'gut',
    ]);
    expect(leafTexts(textElement('Optik & Anrichtung')?.parentElement)).toEqual([
      'Optik & Anrichtung',
      'gut',
    ]);
    expect(leafTexts(textElement('Gesamtnote')?.parentElement)).toEqual([
      'Gesamtnote',
      'gut',
      '1,7',
    ]);
  });

  it('keeps the focus on a stamp and marks it pressed when it is activated', async () => {
    const button = stamp('Geschmack', 3);
    button.focus();

    await grade('Geschmack', 3);

    expect(document.activeElement).toBe(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows the sticker only once all three subjects are graded', async () => {
    await grade('Geschmack', 1);
    await grade('Portionsgröße', 2);
    expect(textElement('Sticker verdient!')).toBeUndefined();

    await grade('Optik & Anrichtung', 2);
    expect(textElement('Sticker verdient!')).toBeDefined();
  });

  it('shows the nudge without sending when submitting with a missing grade and hides it on the next stamp tap, even on the grade already set', async () => {
    await grade('Geschmack', 1);

    submitButton().click();
    await fixture.whenStable();
    httpTesting.expectNone('/api/report-cards');
    expect(textElement('Bitte erst alle drei Fächer benoten!')).toBeDefined();

    await grade('Geschmack', 1);
    expect(textElement('Bitte erst alle drei Fächer benoten!')).toBeUndefined();
  });

  it('posts the trimmed report card and shows the focused success view when the server accepts it', async () => {
    await gradeAllSubjects();
    await type('Wunschzettel', '  mal wieder Falafel  ');
    await type('Nachricht an den Koch', '\nDanke, Manu!\n');

    submitButton().click();
    const request = httpTesting.expectOne({ method: 'POST', url: '/api/report-cards' });
    expect(request.request.body).toEqual({
      grades: { taste: 1, portion: 2, presentation: 2 },
      wishes: 'mal wieder Falafel',
      message: 'Danke, Manu!',
      photo: null,
    });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await vi.waitFor(() => expect(textElement('Abgegeben!')).toBeDefined());
    await fixture.whenStable();

    expect(submitButton()).toBeNull();
    expect(document.activeElement).toBe(textElement('Abgegeben!'));
  });

  it('shows the error text and enables the submit button again when the server answers 502', async () => {
    await gradeAllSubjects();

    submitButton().click();
    httpTesting
      .expectOne('/api/report-cards')
      .flush({ error: 'delivery-failed' }, { status: 502, statusText: 'Bad Gateway' });
    await vi.waitFor(() =>
      expect(textElement('Hat nicht geklappt – bitte noch mal versuchen.')).toBeDefined(),
    );
    await fixture.whenStable();

    expect(submitButton().disabled).toBe(false);
    expect(submitButton().textContent?.trim()).toBe('Zeugnis abgeben');
  });

  it('disables the submit button and reads "Wird abgegeben …" while the request is pending', async () => {
    await gradeAllSubjects();

    submitButton().click();
    await fixture.whenStable();

    expect(submitButton().disabled).toBe(true);
    expect(submitButton().textContent?.trim()).toBe('Wird abgegeben …');

    httpTesting
      .expectOne('/api/report-cards')
      .flush(null, { status: 204, statusText: 'No Content' });
    await vi.waitFor(() => expect(textElement('Abgegeben!')).toBeDefined());
  });

  it('greets the teacher by name and signs the sent report card when the server provides the name', async () => {
    TestBed.inject(TransferState).set(teacherNameKey, 'Ada');
    await renderPage();
    expect(textElement('Liebe Ada, bitte benoten!')).toBeDefined();

    await gradeAllSubjects();
    submitButton().click();
    httpTesting
      .expectOne('/api/report-cards')
      .flush(null, { status: 204, statusText: 'No Content' });
    await vi.waitFor(() => expect(textElement('Abgegeben!')).toBeDefined());
    await fixture.whenStable();

    expect(textElement('Danke, Ada – Manu liest es sich in der Pause durch.')).toBeDefined();
    expect(textElement('Ada')).toBeDefined();
    expect(textElement('Unterschrift der Lehrerin')).toBeDefined();
  });

  it('uses the neutral greeting and thanks without a signature when no name is provided', async () => {
    expect(textElement('Bitte benoten!')).toBeDefined();

    await gradeAllSubjects();
    submitButton().click();
    httpTesting
      .expectOne('/api/report-cards')
      .flush(null, { status: 204, statusText: 'No Content' });
    await vi.waitFor(() => expect(textElement('Abgegeben!')).toBeDefined());
    await fixture.whenStable();

    expect(textElement('Danke – Manu liest es sich in der Pause durch.')).toBeDefined();
    expect(textElement('Unterschrift der Lehrerin')).toBeUndefined();
  });
});
