const cloudinary = require("cloudinary");
const streamifier = require("streamifier");
const uuid = require("uuid");
//streamifier ghi dữ liệu lớn
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});
const uploadToCloudinary = async (stream, folder, imagePublicId) => {
  const options = imagePublicId
    ? { public_id: imagePublicId, overwrite: true }
    : { public_id: `${folder}/${uuid.v4()}` };
  return new Promise((resolve, reject) => {
    const streamLoad = cloudinary.v2.uploader.upload_stream(
      options,
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    return streamifier.createReadStream(stream.buffer).pipe(streamLoad);
  });
};
// const uploadMultiToCloudinary = (file, folder) => {
//   return new Promise((resolve) => {
//     cloudinary.v2.uploader.upload(
//       file,
//       (result) => {
//         resolve({
//           url: result.url,
//           id: result.public_id,
//         });
//       },
//       {
//         resource_type: "auto",
//         folder: folder,
//       }
//     );
//   });
// };
const deleteFromCloudinary = async (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.destroy(publicId, (error, result) => {
      if (result) {
        resolve(result);
      } else {
        reject(error);
      }
    });
  });
};
module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  // uploadMultiToCloudinary,
};
