const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary from env variables. If missing, it will throw or fail silently.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadImages(imagePaths, runId) {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.warn('[Cloudinary] Missing CLOUDINARY_CLOUD_NAME, skipping upload.');
        return [];
    }
    
    const uploadPromises = imagePaths.map(async (filePath) => {
        try {
            if (!fs.existsSync(filePath)) return null;
            const basename = path.basename(filePath, '.png');
            const res = await cloudinary.uploader.upload(filePath, {
                folder: 'devtrack_ai/test_runs',
                public_id: runId ? `${runId}_${basename}` : basename,
                resource_type: 'image',
                use_filename: false,
                unique_filename: false,
                overwrite: true
            });
            return res.secure_url;
        } catch (err) {
            console.error(`[Cloudinary] Failed to upload ${filePath}:`, err.message);
            return null;
        }
    });

    const results = await Promise.all(uploadPromises);
    return results.filter(url => url !== null);
}

module.exports = { uploadImages };
