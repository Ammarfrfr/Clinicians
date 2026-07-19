import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a buffer stream to Cloudinary
 * @param {Buffer} fileBuffer 
 * @param {String} folder 
 * @returns {Promise}
 */
export const uploadToCloudinary = (fileBuffer, folder = 'scribologist_patients') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes an asset from Cloudinary by public ID
 * @param {String} publicId 
 * @returns {Promise}
 */
export const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error('Cloudinary deletion error:', error);
        return reject(error);
      }
      resolve(result);
    });
  });
};
