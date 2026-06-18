const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'admin-cli',
    brokers: ['localhost:9092']
});

const admin = kafka.admin();

async function run() {
    await admin.connect();
    console.log('Connected to Kafka Admin');
    
    try {
        await admin.deleteTopics({
            topics: ['test-run-jobs'],
            timeout: 5000,
        });
        console.log('Successfully deleted topic "test-run-jobs"');
    } catch (err) {
        console.log('Topic might not exist or could not be deleted:', err.message);
    }
    
    await admin.disconnect();
}

run().catch(console.error);
