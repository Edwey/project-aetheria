const URL_REGEX =
  /(https?:\/\/|www\.|\.com|\.org|\.net|\.xyz|\.gg|\.io|[a-z0-9]+\.[a-z]{2,})/gi;

const PROFANITY_LIST = ['badword1', 'slur2'];

export function sanitizeText(input, maxChars = 100) {
  if (!input || typeof input !== 'string') return '';

  let clean = input.replace(URL_REGEX, '[redacted]');
  clean = clean.replace(/<[^>]*>?/gm, '');

  PROFANITY_LIST.forEach((word) => {
    const reg = new RegExp(`\\b${word}\\b`, 'gi');
    clean = clean.replace(reg, '***');
  });

  return clean.trim().slice(0, maxChars);
}
