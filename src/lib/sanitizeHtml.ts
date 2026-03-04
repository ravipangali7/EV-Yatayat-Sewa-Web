/**
 * Lightweight HTML sanitizer for CMS content. Avoids DOMPurify to prevent
 * "Class constructor cannot be invoked without 'new'" in production builds.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img', 'span', 'div',
]);
const ALLOWED_ATTRS = new Set(['href', 'src', 'alt', 'class']);

function sanitizeAttrName(name: string): boolean {
  const lower = name.toLowerCase();
  if (lower.startsWith('on')) return false;
  if (lower === 'style' || lower === 'javascript') return false;
  return ALLOWED_ATTRS.has(lower);
}

function sanitizeAttrValue(tag: string, attr: string, value: string): string {
  const v = (value || '').trim();
  if (attr === 'href' && /^\s*javascript:/i.test(v)) return '#';
  if (attr === 'src' && /^\s*javascript:/i.test(v)) return '';
  return v;
}

function sanitizeNode(node: Node, out: string[]): void {
  if (node.nodeType === Node.TEXT_NODE) {
    out.push(node.textContent || '');
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) {
    // For disallowed tags, recurse into children only (strip wrapper)
    el.childNodes.forEach((c) => sanitizeNode(c, out));
    return;
  }

  const attrs: string[] = [];
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i];
    if (sanitizeAttrName(a.name)) {
      const val = sanitizeAttrValue(tag, a.name.toLowerCase(), a.value);
      attrs.push(`${a.name}="${val.replace(/"/g, '&quot;')}"`);
    }
  }
  const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
  if (['br', 'img'].includes(tag)) {
    out.push(`<${tag}${attrStr}>`);
    return;
  }
  out.push(`<${tag}${attrStr}>`);
  el.childNodes.forEach((c) => sanitizeNode(c, out));
  out.push(`</${tag}>`);
}

export function sanitizeHtml(html: string): string {
  if (typeof document === 'undefined') return '';
  const raw = (html || '').trim();
  if (!raw) return '';
  const div = document.createElement('div');
  div.innerHTML = raw;
  const out: string[] = [];
  div.childNodes.forEach((c) => sanitizeNode(c, out));
  return out.join('');
}
