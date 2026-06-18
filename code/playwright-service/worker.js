require('dotenv').config();
const { Kafka, logLevel } = require('kafkajs');
const { handleTestRunJobCommand } = require('./src/consumer/testRunConsumer');

const os = require('os');

// ─── Concurrency Limiter (Semaphore) ───────────────────────────
// Giới hạn số test run chạy đồng thời trên 1 worker instance
// Tránh overload khi dùng fire-and-forget pattern
class ConcurrencyLimiter {
    constructor(maxConcurrent) {
        this.max = maxConcurrent;
        this.running = 0;
        this.queue = [];
    }

    async acquire() {
        if (this.running < this.max) {
            this.running++;
            return;
        }
        // Đợi cho đến khi có slot trống
        await new Promise(resolve => this.queue.push(resolve));
    }

    release() {
        this.running--;
        if (this.queue.length > 0) {
            this.running++;
            const next = this.queue.shift();
            next();
        }
    }

    get activeCount() {
        return this.running;
    }
}

const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_RUNS) || 3;
const limiter = new ConcurrencyLimiter(MAX_CONCURRENT);

const kafka = new Kafka({
    clientId: `playwright-worker-${os.hostname()}-${process.pid}`,
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    logLevel: logLevel.INFO
});

const consumer = kafka.consumer({
    groupId: 'playwright-service-group',
    sessionTimeout: 60000,    // 60s: đủ ngắn để recover nhanh, đủ dài tránh timeout warning
    heartbeatInterval: 5000   // 5s heartbeat
});

async function run() {
    console.log('Connecting to Kafka...');
    await consumer.connect();
    console.log(`Connected to Kafka (maxConcurrent=${MAX_CONCURRENT})`);

    await consumer.subscribe({ topic: 'test-run-jobs', fromBeginning: false });

    // consumer.run() resolve ngay sau khi setup handler (KHÔNG block).
    // KafkaJS tự quản lý heartbeat, rebalance, reconnect bên trong.
    // CHỈ GỌI MỘT LẦN DUY NHẤT — không wrap trong while(true).
    await consumer.run({
        autoCommit: true,
        autoCommitInterval: 5000,
        partitionsConsumedConcurrently: MAX_CONCURRENT,
        eachMessage: async ({ topic, partition, message }) => {
            const val = message.value.toString();
            console.log(`[Worker] Received message on ${topic} partition=${partition} (active=${limiter.activeCount}/${MAX_CONCURRENT}):`, val);

            try {
                const payload = JSON.parse(val);

                // Acquire semaphore slot — block nếu đã đầy MAX_CONCURRENT slots
                await limiter.acquire();

                // Fire-and-forget: không await → eachMessage return ngay
                // → cho phép nhận message tiếp trên cùng partition (xử lý song song)
                // autoCommit: true đã tự commit offset theo thời gian, không phụ thuộc vào handler xong
                handleTestRunJobCommand(payload)
                    .catch(err => {
                        console.error(`[Worker] Error processing test run ${payload.testRunId}:`, err);
                    })
                    .finally(() => {
                        limiter.release();
                        console.log(`[Worker] Slot released (active=${limiter.activeCount}/${MAX_CONCURRENT})`);
                    });
            } catch (err) {
                console.error(`[Worker] Fatal infrastructure error processing message:`, err);
            }
        },
    });

    console.log('Consumer is running and listening for messages.');
}

// Gọi run() MỘT LẦN DUY NHẤT.
// Nếu lỗi khi khởi tạo (Kafka broker chưa sẵn sàng) → retry với backoff.
// Sau khi consumer.run() thành công, KafkaJS tự xử lý reconnect nội bộ.
(async () => {
    const MAX_RETRIES = 10;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await run();
            // consumer.run() resolved → consumer đang chạy nền, thoát loop
            break;
        } catch (err) {
            console.error(`[Startup] Attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);
            try { await consumer.disconnect(); } catch (e) {}
            if (attempt === MAX_RETRIES) {
                console.error('[Startup] Max retries reached. Exiting.');
                process.exit(1);
            }
            const delay = Math.min(attempt * 3000, 15000); // 3s, 6s, 9s, ... max 15s
            console.log(`[Startup] Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
})();

// Handle graceful shutdown
const errorTypes = ['unhandledRejection', 'uncaughtException'];
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

errorTypes.forEach(type => {
    process.on(type, async e => {
        try {
            console.log(`process.on ${type}`);
            console.error(e);
            await consumer.disconnect();
            process.exit(0);
        } catch (_) {
            process.exit(1);
        }
    });
});

signalTraps.forEach(type => {
    process.once(type, async () => {
        try {
            await consumer.disconnect();
        } finally {
            process.kill(process.pid, type);
        }
    });
});

