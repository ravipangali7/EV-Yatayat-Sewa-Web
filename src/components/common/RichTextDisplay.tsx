import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

export interface RichTextDisplayProps {
  html: string;
  className?: string;
}

export function RichTextDisplay({ html, className }: RichTextDisplayProps) {
  const sanitized = sanitizeHtml(html || '');
  return (
    <div
      className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
