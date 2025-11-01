import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_CLOUDNAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    // Upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // console.log("File is uploaded in cloudinary.", response?.url);

    if (localFilePath) {
      fs.unlinkSync(localFilePath);
    }

    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locallay save temporary file as the upload operation got failed.
    return null;
  }
};

export { uploadCloudinary };
