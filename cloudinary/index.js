const { v2: cloudinary } = require("cloudinary");
const ExpressError = require("../utils/ExpressError");
const path = require("path");

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

cloudinary.config({
  cloud_name: "dtvitkoxo",
  api_key: "166811827396576",
  api_secret: "8IJWlWfVKC-tuRKgiI42OioUHIs", // Click 'View Credentials' below to copy your API secret
});

const handleUpload = (file, id) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: id,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        }
      )
      .end(file);
  });
};

module.exports = { handleUpload };
