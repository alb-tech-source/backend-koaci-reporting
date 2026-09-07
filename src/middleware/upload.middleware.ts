import multer from "multer";

// Storage configuration - store files in memory
const storage = multer.memoryStorage();

// File filter factory to validate file types
const buildFileFilter = (allowedMimeTypes: string[]) => {
  return (
    req: any,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only allowed file types are permitted."));
    }
  };
};

// Allowed MIME types for documents (PDF, images, documents)
const documentMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Allowed MIME types for project reporting media (photo, video, document)
const mediaMimeTypes = [
  ...documentMimeTypes,
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
];

// Multer upload configuration
export const upload = multer({
  storage,
  fileFilter: buildFileFilter(documentMimeTypes),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Multer upload configuration for reporting media (larger limit for video)
export const uploadMedia = multer({
  storage,
  fileFilter: buildFileFilter(mediaMimeTypes),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});
