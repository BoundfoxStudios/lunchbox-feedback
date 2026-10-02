import { Component, computed, input } from '@angular/core';

const variantClasses = {
  sticker: { petal: '-ml-3 -mt-14 h-14 w-6', core: '-ml-7 -mt-7 size-14 ring-3' },
  stamp: { petal: '-ml-1 -mt-5 h-5 w-2', core: '-ml-3 -mt-3 size-6 ring-2' },
} as const;

@Component({
  selector: 'app-sunflower',
  host: { 'aria-hidden': 'true' },
  template: `
    @for (rotation of petalRotations; track rotation) {
      <span
        class="absolute left-1/2 top-1/2 origin-bottom rounded-full bg-linear-to-b/srgb from-sun-300 to-sun-400"
        [class]="classes().petal + ' ' + rotation"
      ></span>
    }
    <span
      class="absolute left-1/2 top-1/2 rounded-full bg-seeds ring-inset ring-seed-800"
      [class]="classes().core"
    ></span>
  `,
})
export class Sunflower {
  readonly variant = input.required<'sticker' | 'stamp'>();

  protected readonly classes = computed(() => variantClasses[this.variant()]);
  protected readonly petalRotations = [
    'rotate-0',
    'rotate-30',
    'rotate-60',
    'rotate-90',
    'rotate-120',
    'rotate-150',
    'rotate-180',
    'rotate-210',
    'rotate-240',
    'rotate-270',
    'rotate-300',
    'rotate-330',
  ];
}
