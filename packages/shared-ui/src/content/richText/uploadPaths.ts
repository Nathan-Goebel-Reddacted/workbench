export function resolveUploadPaths(html: string, apiUrl: string): string {
  return html.replace(/(src|href)="(\/uploads\/[^"]*)"/g, `$1="${apiUrl}$2"`)
}
