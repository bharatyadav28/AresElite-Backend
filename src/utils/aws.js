const S3 = require("aws-sdk/clients/s3");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;
const multer = require("multer");
const storage = multer.memoryStorage();

exports.s3Uploadv2 = async (file) => {
  // Initialize S3 client with credentials
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET,
    region: process.env.AWS_REGION,
  });

  // Extract file type from mimetype (e.g., "video/mp4" -> "video")
  const fileType = file.mimetype.split("/")[0];

  // Set up common S3 parameters
  const baseParams = {
    Bucket: process.env.AWS_BUCKET,
    Body: file.buffer,
  };

  // Handle video files
  if (fileType === "video") {
    // For videos, we might want to increase timeout and part size for larger files
    const params = {
      ...baseParams,
      Key: `uploads/videos/${Date.now().toString()}-${file.originalname}`,
      // Set content type explicitly for videos
      ContentType: file.mimetype,
      // Optional: Configure multipart upload for large files
      ContentDisposition: "inline",
      // Optional: Set maximum upload timeout (15 minutes)
      Expires: 900,
    };

    return await s3
      .upload(params, {
        // Configure upload parameters for large files
        partSize: 10 * 1024 * 1024, // 10MB parts
        queueSize: 4, // Number of simultaneous uploads
      })
      .promise();
  }

  // Handle image files
  if (fileType === "image") {
    const params = {
      ...baseParams,
      Key: `uploads/images/${Date.now().toString()}-${file.originalname}`,
      ContentType: file.mimetype,
    };

    return await s3.upload(params).promise();
  }

  // If file type is neither video nor image, throw error
  throw new Error("Unsupported file type");
};

exports.s3UploadMultiv2 = async (files, id) => {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET,
    region: process.env.AWS_REGION,
  });

  const uploads = [];

  for (const file of files) {
    if (file.mimetype.split("/")[0] === "video") {
      const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: `uploads/videos/${Date.now().toString()}-${file.originalname}`,
        Body: file.buffer,
      };
      uploads.push(s3.upload(params).promise());
    }

    if (file.mimetype.split("/")[0] === "image") {
      const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: `uploads/images/${Date.now().toString()}-${file.originalname}`,
        Body: file.buffer,
      };
      uploads.push(s3.upload(params).promise());
    }
  }

  return Promise.all(uploads);
};

exports.s3Delete = async (file) => {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET,
    region: process.env.AWS_REGION,
  });

  try {
    const fileParts = file.split("/");
    const key1 = fileParts[5];
    const fileType = fileParts[4];

    let keyPrefix = "";
    if (fileType === "videos") {
      keyPrefix = "uploads/videos/";
    } else if (fileType === "images") {
      keyPrefix = "uploads/images/";
    } else {
      throw new Error("Unsupported file type");
    }

    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: `${keyPrefix}${key1}`,
    };

    const result = await s3.deleteObject(params).promise();
    console.log(`Successfully deleted ${fileType} from S3:`, result);
    return result;
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw error;
  }
};

exports.s3UpdateImage = async (file, oldFile) => {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET,
    region: process.env.AWS_REGION,
  });

  const key1 = oldFile.split("/")[2];
  const param = {
    Bucket: process.env.AWS_BUCKET,
    Key: `uploads/profiles/${key1}`,
  };

  await s3.deleteObject(param).promise();

  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: `uploads/profiles/${Date.now().toString()}-${file.originalname}`,
    Body: file.buffer,
  };

  return await s3.upload(params).promise();
};

exports.upload = multer({
  storage,
  limits: {
    fileSize: 51006600,
    files: 5,
  },
});
