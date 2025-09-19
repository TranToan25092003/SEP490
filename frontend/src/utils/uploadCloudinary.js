export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "huynt7104");
  formData.append("cloud_name", "db4tuojnn");

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/db4tuojnn/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};
