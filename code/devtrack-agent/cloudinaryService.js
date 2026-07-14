const fs = require('fs');
const path = require('path');

/**
 * Upload screenshot files to Cloudinary via REST API (no SDK needed).
 * Returns array of secure_url strings.
 */
async function uploadScreenshots(screenshotPaths, runId, cloudConfig) {
    const { cloudName, apiKey, apiSecret } = cloudConfig;
    if (!cloudName || !apiKey || !apiSecret) {
        console.warn('[Cloudinary] Missing config, skipping upload.');
        return [];
    }

    const results = [];
    for (const filePath of screenshotPaths) {
        try {
            if (!fs.existsSync(filePath)) continue;
            const basename = path.basename(filePath, path.extname(filePath));
            const publicId = `devtrack_ai/test_runs/${runId}_${basename}`;

            // Build multipart form data manually
            const fileData = fs.readFileSync(filePath);
            const base64Data = fileData.toString('base64');
            const dataUri = `data:image/png;base64,${base64Data}`;

            // Generate SHA-1 signature
            const crypto = require('crypto');
            const timestamp = Math.floor(Date.now() / 1000);
            const paramsToSign = `folder=devtrack_ai/test_runs&overwrite=true&public_id=${publicId}&timestamp=${timestamp}`;
            const signature = crypto.createHash('sha1')
                .update(paramsToSign + apiSecret)
                .digest('hex');

            // Upload via fetch
            const formData = new URLSearchParams();
            formData.append('file', dataUri);
            formData.append('public_id', publicId);
            formData.append('folder', 'devtrack_ai/test_runs');
            formData.append('overwrite', 'true');
            formData.append('timestamp', timestamp.toString());
            formData.append('api_key', apiKey);
            formData.append('signature', signature);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });

            if (res.ok) {
                const json = await res.json();
                results.push(json.secure_url);
                console.log(`[Cloudinary] Uploaded: ${json.secure_url}`);
            } else {
                const err = await res.text();
                console.error(`[Cloudinary] Upload failed for ${filePath}: ${err.substring(0, 200)}`);
            }
        } catch (e) {
            console.error(`[Cloudinary] Error uploading ${filePath}:`, e.message);
        }
    }
    return results;
}

module.exports = { uploadScreenshots };
