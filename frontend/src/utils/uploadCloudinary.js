// Upload single file to Cloudinary
export const uploadFile = async (file, options = {}) => {
  const {
    uploadPreset = "huynt7104",
    cloudName = "djo2yviru",
    folder = "motormate",
    resourceType = "auto",
  } = options;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
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
      const errorText = await response.text();
      console.error("Cloudinary upload error:", errorText);
      throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
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

// Upload image to specific folder
export const uploadImageToFolder = async (file, subfolder = "general") => {
  const result = await uploadFile(file, {
    resourceType: "image",
    folder: `motormate/img/${subfolder}`,
    uploadPreset: "huynt7104",
  });
  return result;
};

// Upload video to specific folder
export const uploadVideoToFolder = async (file, subfolder = "general") => {
  const result = await uploadFile(file, {
    resourceType: "video",
    folder: `motormate/video/${subfolder}`,
    uploadPreset: "huynt7104",
  });
  return result;
};

// Upload PDF to specific folder
export const uploadPDFToFolder = async (file, subfolder = "general") => {
  const result = await uploadFile(file, {
    resourceType: "raw",
    folder: `motormate/pdf/${subfolder}`,
    uploadPreset: "huynt7104",
  });
  return result;
};

// Specific upload functions for different use cases
export const uploadPartImage = async (file) => {
  return await uploadImageToFolder(file, "part");
};

export const uploadUserImage = async (file) => {
  return await uploadImageToFolder(file, "user");
};

export const uploadPartVideo = async (file) => {
  return await uploadVideoToFolder(file, "part");
};

export const uploadReceiptPDF = async (file) => {
  return await uploadPDFToFolder(file, "receipt");
};

export const uploadInvoicePDF = async (file) => {
  return await uploadPDFToFolder(file, "invoice");
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
