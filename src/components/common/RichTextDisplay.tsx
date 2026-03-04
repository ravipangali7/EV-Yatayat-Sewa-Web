import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

export interface RichTextDisplayProps {
  html: string;
  className?: string;
}

const defaultAllowed = [
  'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img', 'span', 'div',
];

export function RichTextDisplay({ html, className }: RichTextDisplayProps) {
  const sanitized = DOMPurify.sanitize(html || '', { ALLOWED_TAGS: defaultAllowed, ALLOWED_ATTR: ['href', 'src', 'alt', 'class'] });
  return (
    <div
      className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
