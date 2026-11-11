export function safeRedirect(url: string, baseUrl: string): string {
  if (/[\u0000-\u001F\u007F\s]/.test(url)) return baseUrl;
  try {
    const base = new URL(baseUrl);
    const resolved = new URL(url, base);
    if (resolved.origin !== base.origin) return baseUrl;
    if (url.startsWith("/")) return `${resolved.pathname}${resolved.search}${resolved.hash}`;
    return resolved.toString();
  } catch {
    // URLs inválidas vuelven al origen de la aplicación.
  }
  return baseUrl;
}
