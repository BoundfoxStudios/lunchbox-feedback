import { makeStateKey } from '@angular/core';

export const teacherNameKey = makeStateKey<string | null>('teacherName');
