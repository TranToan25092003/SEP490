// Upload single file to Cloudinary
export const uploadFile = async (file, options = {}) => {
  const {
    uploadPreset = "huynt7104",
    cloudName = "db4tuojnn",
    folder = "motormate",
    resourceType = "auto", // auto, image, video, raw
  } = options;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("cloud_name", cloudName);
  formData.append("folder", folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      publicId: data.public_id,
      url: data.secure_url,
      kind: getFileKind(data.resource_type, file.type),
      originalName: file.name,
      size: file.size,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// Upload multiple files
export const uploadMultipleFiles = async (files, options = {}) => {
  const uploadPromises = Array.from(files).map((file) =>
    uploadFile(file, options)
  );

  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("Error uploading multiple files:", error);
    throw error;
  }
};

// Upload image (backward compatibility)
export const uploadImage = async (file) => {
  const result = await uploadFile(file, { resourceType: "image" });
  return result.url;
};

// Determine file kind based on resource type and MIME type
const getFileKind = (resourceType, mimeType) => {
  if (resourceType === "image") return "image";
  if (resourceType === "video") return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "other";
};

// Validate file before upload
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "application/pdf",
    ],
    allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".mp4",
      ".webm",
      ".pdf",
    ],
  } = options;

  const errors = [];

  // Check file size
  if (file.size > maxSize) {
    errors.push(
      `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
    );
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  // Check file extension
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));
  if (!allowedExtensions.includes(extension)) {
    errors.push(`File extension ${extension} is not allowed`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
