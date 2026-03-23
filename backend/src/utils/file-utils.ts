/**
 * This file groups small reusable file-system helpers used by the backend.
 * It exists to keep file sanitation and directory handling out of the services themselves.
 * It fits the system by making evidence storage logic simpler and easier to audit.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * This function ensures that a directory exists on disk.
 * It receives an absolute or relative directory path.
 * It returns a promise that resolves after the directory exists.
 * It is important because upload storage should not depend on manual folder creation.
 */
export async function ensureDirectoryExists(directoryPath: string) {
  await fs.mkdir(directoryPath, { recursive: true });
}

/**
 * This function sanitizes a filename for safe local storage.
 * It receives the original filename provided by the client.
 * It returns a filesystem-safe filename fragment.
 * It is important because upload paths should never trust user-supplied names directly.
 */
export function sanitizeFileName(originalFileName: string) {
  const baseName = path.basename(originalFileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  return baseName.length > 0 ? baseName : "evidence";
}

/**
 * This function strips non-printable control characters from extracted text.
 * It receives raw text extracted from a file.
 * It returns a cleaned text string.
 * It is important because AI prompts and database storage should not contain malformed binary leftovers.
 */
export function normalizeExtractedText(rawText: string) {
  return Array.from(rawText)
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint === 9 || codePoint === 10 || codePoint === 13 || codePoint >= 32;
    })
    .join("")
    .trim();
}
