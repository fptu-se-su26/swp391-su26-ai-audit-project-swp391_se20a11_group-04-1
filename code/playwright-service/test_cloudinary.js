require('dotenv').config();
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
cloudinary.uploader.upload('d:/FPTU/semeter_5/DevTrackAI/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/frontend/public/vite.svg', {
    folder: 'devtrack_ai/test_runs',
    public_id: 'test-123/vite-logo',
    resource_type: 'image',
    use_filename: false,
    unique_filename: false,
    overwrite: false
}).then(console.log).catch(err => console.error(err.message));
