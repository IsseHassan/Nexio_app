import { Store } from '../models/Store.js';
import { Kit } from '../models/Kit.js';

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export { Store, Kit };
