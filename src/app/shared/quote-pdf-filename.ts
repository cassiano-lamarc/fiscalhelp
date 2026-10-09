import type { Quote } from '../core/http/api.service';

export function quotePdfFilename(quote: Quote): string {
  const customer = (quote.customerName ?? '').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '_').trim().replace(/[. ]+$/, '') || 'cliente';
  return `orc_${customer}_${quote.number}.pdf`;
}
