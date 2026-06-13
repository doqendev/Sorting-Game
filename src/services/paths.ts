const appBaseUrl = import.meta.env.BASE_URL || "/";

export function appUrl(path: string): string {
  if (!path) return path;
  if (/^(?:https?:|data:|blob:)/.test(path)) return path;
  const base = appBaseUrl.endsWith("/") ? appBaseUrl : `${appBaseUrl}/`;
  return `${base}${path.replace(/^\/+/, "")}`;
}

export function rewriteAppUrls(markup: string): string {
  return markup
    .replaceAll('src="/assets/', `src="${appUrl("assets/")}`)
    .replaceAll("src='/assets/", `src='${appUrl("assets/")}`)
    .replaceAll('href="/assets/', `href="${appUrl("assets/")}`)
    .replaceAll("href='/assets/", `href='${appUrl("assets/")}`);
}
