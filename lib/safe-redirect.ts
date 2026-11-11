export function safeRedirect(url: string, baseUrl: string): string {
  if (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) return url;
  try {
    if (new URL(url).origin === baseUrl) return url;
  } catch {
    // URLs inválidas vuelven al origen de la aplicación.
  }
  return baseUrl;
}
