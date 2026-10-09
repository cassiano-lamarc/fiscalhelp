import type { Quote } from '../core/http/api.service';

export function quotePdfFilename(quote: Quote): string {
  const company = (quote.snapshot?.name ?? '').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '_').trim().replace(/[. ]+$/, '') || 'empresa';
  return `ORC_${quote.id}_${company}.pdf`;
}
