import { Component, input, model, output } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { Grade, gradeWords, grades } from '../../shared/grading';
import { Sunflower } from './sunflower';

@Component({
  selector: 'app-grade-stamps',
  imports: [Sunflower],
  host: {
    role: 'group',
    '[attr.aria-labelledby]': 'labelledBy()',
    class: 'grid grid-cols-6 gap-1.5',
  },
  template: `
    @for (grade of grades; track grade) {
      @let isStamped = value() === grade;
      <div class="grid">
        <button
          type="button"
          [attr.aria-label]="'Note ' + grade + ' – ' + gradeWords[grade]"
          [attr.aria-pressed]="isStamped"
          class="h-12 w-full cursor-pointer rounded-full bg-transparent p-0 font-bold leading-none"
          [class]="
            isStamped
              ? 'relative -rotate-6 border-0 text-base text-cream drop-shadow-md animate-stamp motion-reduce:animate-none'
              : 'border-2 border-dotted border-plum-700/50 text-xl text-plum-700 transition-transform duration-100 active:scale-90'
          "
          (click)="value.set(grade); stamped.emit()"
        >
          @if (isStamped) {
            <app-sunflower variant="stamp" class="absolute inset-0" />
            <span class="relative z-10">{{ grade }}</span>
          } @else {
            {{ grade }}
          }
        </button>
      </div>
    }
  `,
})
export class GradeStamps implements FormValueControl<Grade | null> {
  readonly value = model<Grade | null>(null);
  readonly labelledBy = input.required<string>();
  readonly stamped = output();

  protected readonly grades = grades;
  protected readonly gradeWords = gradeWords;
}
