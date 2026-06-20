import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'img', 'a',
];

export function sanitize(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { img: ['src', 'width', 'height'], a: ['href'] },
    allowedSchemes: ['http', 'https'],
  });
}
