const S3 = require("aws-sdk/clients/s3");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;
const multer = require("multer");
const storage = multer.memoryStorage();

exports.s3Uploadv2 = async (file) => {
    const s3 = new S3({
        accessKeyId: process.env.AWS_ACCESS,
        secretAccessKey: process.env.AWS_SECRET,
        region: process.env.AWS_REGION,
    });

    if (file.mimetype.split("/")[0] === "video") {
        const params = {
            Bucket: process.env.AWS_BUCKET,
            Key: `uploads/videos/${Date.now().toString()}-${file.originalname}`,
            Body: file.buffer,
        };

        return await s3.upload(params).promise();
    }

    if (file.mimetype.split("/")[0] === "image") {
        const params = {
            Bucket: process.env.AWS_BUCKET,
            Key: `uploads/images/${Date.now().toString()}-${file.originalname}`,
            Body: file.buffer,
        };

        return await s3.upload(params).promise();
    }
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

        let keyPrefix = '';
        if (fileType === 'videos') {
            keyPrefix = 'uploads/videos/';
        } else if (fileType === 'images') {
            keyPrefix = 'uploads/images/';
        } else {
            throw new Error('Unsupported file type');
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