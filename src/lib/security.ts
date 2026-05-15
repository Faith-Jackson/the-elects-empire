/**
 * Security utilities for The Elects Empire
 * Provides HTML sanitization, input validation, and rate limiting.
 */

// ============================================================
// 1. HTML SANITIZER — prevents XSS from dangerouslySetInnerHTML
// ============================================================

// Allowed tags and attributes for user-generated rich content
const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'i', 'u', 'em', 'strong', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
  'span', 'div', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr', 'sub', 'sup', 'mark', 'del', 's', 'figure', 'figcaption',
]);

const ALLOWED_ATTRS = new Set([
  'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
  'width', 'height', 'style', 'data-type', 'data-checked',
  'colspan', 'rowspan',
]);

// Dangerous URL schemes
const DANGEROUS_SCHEMES = /^(javascript|vbscript|data(?!:image\/))/i;

/**
 * Sanitize HTML string to prevent XSS attacks.
 * Strips dangerous tags (script, iframe, object, etc.),
 * removes event handler attributes, and validates URLs.
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Walk all nodes and sanitize
  const walk = (node: Node): void => {
    const children = Array.from(node.childNodes);
    
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tagName = el.tagName.toLowerCase();
        
        // Remove disallowed tags entirely
        if (!ALLOWED_TAGS.has(tagName)) {
          // Keep text content of non-dangerous tags, remove dangerous ones completely
          if (['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button', 'style', 'link', 'meta', 'base'].includes(tagName)) {
            el.remove();
          } else {
            // Replace with text content
            const text = document.createTextNode(el.textContent || '');
            node.replaceChild(text, el);
          }
          continue;
        }
        
        // Remove all disallowed attributes
        const attrs = Array.from(el.attributes);
        for (const attr of attrs) {
          const attrName = attr.name.toLowerCase();
          
          // Remove event handlers (onclick, onerror, etc.)
          if (attrName.startsWith('on')) {
            el.removeAttribute(attr.name);
            continue;
          }
          
          // Remove disallowed attributes
          if (!ALLOWED_ATTRS.has(attrName)) {
            el.removeAttribute(attr.name);
            continue;
          }
          
          // Validate URL attributes
          if (['href', 'src'].includes(attrName)) {
            const value = attr.value.trim();
            if (DANGEROUS_SCHEMES.test(value)) {
              el.removeAttribute(attr.name);
            }
          }
        }
        
        // Force external links to open safely
        if (tagName === 'a') {
          el.setAttribute('rel', 'noopener noreferrer');
          el.setAttribute('target', '_blank');
        }
        
        // Recurse into children
        walk(el);
      }
    }
  };
  
  walk(doc.body);
  return doc.body.innerHTML;
}


// ============================================================
// 2. RATE LIMITER — prevents AI and API abuse
// ============================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Client-side rate limiter.
 * Returns true if the action is allowed, false if rate-limited.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  
  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }
  
  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

// Pre-configured rate limiters
export const AI_RATE_LIMIT = {
  key: 'ai_chat',
  maxRequests: 20,
  windowMs: 60_000, // 20 requests per minute
};

export const AI_GENERATION_LIMIT = {
  key: 'ai_generation',
  maxRequests: 5,
  windowMs: 60_000, // 5 generations per minute
};

export const FORUM_POST_LIMIT = {
  key: 'forum_post',
  maxRequests: 10,
  windowMs: 60_000, // 10 posts per minute
};


// ============================================================
// 3. INPUT VALIDATION — validates user inputs before DB writes
// ============================================================

/**
 * Sanitize plain text input (strip HTML, trim, limit length).
 */
export function sanitizeTextInput(input: string, maxLength: number = 10000): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '') // Strip all HTML tags
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate and sanitize a display name.
 */
export function sanitizeDisplayName(name: string): string {
  return name
    .replace(/<[^>]*>/g, '')     // Strip HTML
    .replace(/[^\w\s\-'.]/g, '') // Allow only safe characters
    .trim()
    .slice(0, 50);
}

/**
 * Validate a UUID format.
 */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Validate a URL is safe (no javascript: or data: schemes).
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate forum/discussion content.
 */
export function validatePostContent(content: string): { valid: boolean; error?: string } {
  const trimmed = content.trim();
  if (!trimmed) return { valid: false, error: 'Content cannot be empty.' };
  if (trimmed.length < 2) return { valid: false, error: 'Content is too short.' };
  if (trimmed.length > 50000) return { valid: false, error: 'Content exceeds maximum length (50,000 characters).' };
  return { valid: true };
}

/**
 * Validate thread title.
 */
export function validateThreadTitle(title: string): { valid: boolean; error?: string } {
  const trimmed = title.trim();
  if (!trimmed) return { valid: false, error: 'Title cannot be empty.' };
  if (trimmed.length < 3) return { valid: false, error: 'Title must be at least 3 characters.' };
  if (trimmed.length > 200) return { valid: false, error: 'Title exceeds maximum length (200 characters).' };
  return { valid: true };
}
