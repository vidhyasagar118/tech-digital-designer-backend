import multer from "multer";

const storage =
  multer.memoryStorage();

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function fileFilter(
  req,
  file,
  callback
) {
  if (
    allowedMimeTypes.includes(
      file.mimetype
    )
  ) {
    callback(null, true);
    return;
  }

  callback(
    new Error(
      "Only JPG, PNG and WEBP images are allowed."
    )
  );
}

export const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize:
      5 * 1024 * 1024,
  },
});