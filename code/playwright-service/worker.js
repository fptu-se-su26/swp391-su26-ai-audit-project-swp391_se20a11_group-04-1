require('dotenv').config();
const { Kafka, logLevel } = require('kafkajs');
const { handleTestRunJobCommand } = require('./src/consumer/testRunConsumer');

const kafka = new Kafka({
    clientId: 'playwright-worker',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    logLevel: logLevel.INFO
});

const consumer = kafka.consumer({ 
    groupId: 'playwright-service-group',
    sessionTimeout: 300000,
    heartbeatInterval: 10000 
});

async function run() {
    console.log('Connecting to Kafka...');
    await consumer.connect();
    console.log('Connected to Kafka');

    await consumer.subscribe({ topic: 'test-run-jobs', fromBeginning: false });

    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            const val = message.value.toString();
            console.log(`[Worker] Received message on ${topic}:`, val);
            try {
                const payload = JSON.parse(val);
                await handleTestRunJobCommand(payload);
                await consumer.commitOffsets([
                    { topic, partition, offset: (BigInt(message.offset) + 1n).toString() }
                ]);
            } catch (err) {
                console.error('[Worker] Error processing message:', err);
                // Do not throw err to prevent consumer from crashing on business logic errors.
                // We just skip this message and continue.
            }
        },
    });
}

const startWorker = async () => {
    while (true) {
        try {
            await run();
            break; // if run() resolves, we exit normally
        } catch (err) {
            console.error('Consumer crashed, reconnecting in 5s...', err);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};
startWorker();

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
