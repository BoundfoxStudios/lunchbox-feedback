import { Component, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { shrinkPhoto } from './shrink-photo';

@Component({
  selector: 'app-photo-polaroid',
  host: { class: 'block' },
  template: `
    <input
      #fileInput
      id="photo"
      type="file"
      accept="image/*"
      aria-label="Foto fürs Klassenbuch"
      [attr.tabindex]="value() ? -1 : null"
      class="peer sr-only"
      (change)="selectPhoto(fileInput)"
    />
    @if (value(); as photo) {
      <div class="relative -rotate-1 bg-white p-2.5 pb-3 shadow-md">
        <img [src]="photo" alt="Foto vom Essplatz" class="h-60 w-full object-cover" />
        <p class="mt-2.5 text-center font-hand text-xl font-semibold leading-none text-marker-500">
          Essplatz heute
        </p>
        <button
          type="button"
          aria-label="Foto entfernen"
          class="absolute top-4 right-4 cursor-pointer rounded-md border-0 bg-plum-900/90 px-2.5 py-2 text-xs font-bold leading-none text-white"
          (click)="removePhoto(fileInput)"
        >
          Entfernen
        </button>
      </div>
    } @else {
      <label
        for="photo"
        class="block -rotate-1 cursor-pointer bg-white p-2.5 pb-3 shadow-md peer-focus-visible:outline-2 peer-focus-visible:outline-plum-700"
      >
        <div
          class="flex h-32 flex-col items-center justify-center gap-1 border-2 border-dashed border-plum-700/45 px-4 text-center text-sm leading-snug text-plum-700"
        >
          <span>+ Foto fürs Klassenbuch</span>
          <span class="text-xs leading-4 text-plum-500">optional – wo isst du heute?</span>
        </div>
        <p class="mt-2.5 text-center font-hand text-xl font-semibold leading-none text-marker-500">
          Essplatz heute
        </p>
      </label>
    }
  `,
})
export class PhotoPolaroid implements FormValueControl<string | null> {
  readonly value = model<string | null>(null);

  protected async selectPhoto(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    try {
      this.value.set(await shrinkPhoto(file));
    } catch {
      // An undecodable file keeps the previous photo.
    } finally {
      input.value = '';
    }
  }

  protected removePhoto(input: HTMLInputElement): void {
    this.value.set(null);
    input.focus();
  }
}
