const Redis = require('ioredis');

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    lazyConnect: false,          // connect ngay khi khởi tạo
    enableOfflineQueue: true,    // queue commands khi đang reconnect
    retryStrategy: (times) => {
        if (times > 5) return null; // stop retrying sau 5 lần
        return Math.min(times * 500, 3000);
    },
    connectTimeout: 5000,
    maxRetriesPerRequest: 3
});

redis.on('connect', () => {
    console.log(`[Redis] Connected to ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
});

redis.on('error', (err) => {
    // Log nhưng không crash worker — Redis tracking là optional
    console.warn('[Redis] Connection error (partition tracking disabled):', err.message);
});

// Key patterns
const PARTITION_ACTIVE_KEY = (partition) => `kafka:partition:${partition}:active`;
const TESTRUN_PARTITION_KEY = (testRunId) => `kafka:testrun:${testRunId}:partition`;
const TTL_SECONDS = 60 * 60; // 1 giờ safety TTL tránh leak

/**
 * Ghi nhận job đang active trên partition.
 * Gọi khi worker nhận message từ Kafka.
 */
async function trackJobStart(partition, testRunId) {
    try {
        const partKey = PARTITION_ACTIVE_KEY(partition);
        const runKey = TESTRUN_PARTITION_KEY(testRunId);

        const pipeline = redis.pipeline();
        pipeline.incr(partKey);
        pipeline.expire(partKey, TTL_SECONDS);
        pipeline.set(runKey, String(partition), 'EX', TTL_SECONDS);
        // Xóa cache snapshot để lần poll tiếp theo của scheduler đọc activeJobs fresh
        pipeline.del('admin:resource:kafkaStatus');
        await pipeline.exec();

        console.log(`[Redis] Partition-${partition} active++ (testRunId=${testRunId})`);
    } catch (err) {
        console.warn(`[Redis] trackJobStart failed (non-fatal):`, err.message);
    }
}

/**
 * Giảm counter khi job hoàn thành.
 * Gọi khi worker gửi callback result về backend thành công.
 */
async function trackJobEnd(testRunId) {
    try {
        const runKey = TESTRUN_PARTITION_KEY(testRunId);
        const partitionStr = await redis.get(runKey);

        if (partitionStr !== null) {
            const partKey = PARTITION_ACTIVE_KEY(parseInt(partitionStr));
            const remaining = await redis.decr(partKey);
            // Không để âm
            if (remaining < 0) await redis.set(partKey, '0');
            await redis.del(runKey);
            // Xóa cache snapshot để UI cập nhật activeJobs về 0 ngay sau khi job xong
            await redis.del('admin:resource:kafkaStatus');
            console.log(`[Redis] Partition-${partitionStr} active-- (testRunId=${testRunId})`);
        }
    } catch (err) {
        console.warn(`[Redis] trackJobEnd failed (non-fatal):`, err.message);
    }
}

module.exports = { redis, trackJobStart, trackJobEnd };
