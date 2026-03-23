/**
 * This file configures the multer upload middleware used for evidence ingestion.
 * It exists to centralize file size limits, storage and MIME filtering.
 * It fits the system by making evidence uploads safe and predictable before they reach the service layer.
 */
import crypto from "node:crypto";
import { mkdir } from "node:fs";
import path from "node:path";

import multer from "multer";

import { env } from "../config/env";
import { AppError } from "../utils/app-error";
import { sanitizeFileName } from "../utils/file-utils";

const allowedMimeTypes = new Set(["application/pdf", "text/plain"]);

const storage = multer.diskStorage({
  /**
   * This function selects the destination directory for uploaded files.
   * It receives the request, the uploaded file metadata and the multer callback.
   * It returns the configured upload directory through the callback.
   * It is important because evidence should land in one controlled location on disk.
   */
  destination(_request, _file, callback) {
    mkdir(env.UPLOAD_DIR, { recursive: true }, (error) => {
      if (error !== null) {
        callback(error, env.UPLOAD_DIR);
        return;
      }

      callback(null, env.UPLOAD_DIR);
    });
  },

  /**
   * This function generates a sanitized stored filename for each uploaded file.
   * It receives the request, the uploaded file metadata and the multer callback.
   * It returns a randomized safe filename through the callback.
   * It is important because user-controlled filenames should never be used directly on disk.
   */
  filename(_request, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBaseName = sanitizeFileName(path.basename(file.originalname, extension));
    const randomSuffix = crypto.randomUUID();

    callback(null, `${safeBaseName}-${randomSuffix}${extension}`);
  }
});

/**
 * This constant defines the configured multer instance for evidence uploads.
 * It receives runtime configuration from the validated environment.
 * It returns a multer middleware factory.
 * It is important because upload limits and file type filters are part of the backend security boundary.
 */
export const upload = multer({
  fileFilter(_request, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError(400, "FILE_TYPE_UNSUPPORTED", "Only PDF and TXT files are allowed."));
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_BYTES,
    files: 1
  },
  storage
});
