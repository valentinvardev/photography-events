import path from "path";

export const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".avi", ".webm", ".mkv", ".m4v"]);
export const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  "video/x-matroska",
  "video/x-m4v",
]);

export function isVideoFilename(filename: string): boolean {
  return VIDEO_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

export function isVideoMimeType(mimeType: string | null | undefined): boolean {
  return !!mimeType && mimeType.startsWith("video/");
}
