export function getSiteUrl(): string {
  const v = (import.meta as any).env?.VITE_SITE_URL as string | undefined;
  const url = (v || window.location.origin).trim();
  // Normalize (no trailing slash)
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

