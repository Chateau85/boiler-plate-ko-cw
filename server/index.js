const mongoose = require('mongoose');
const { createApp } = require('./app');
const { loadConfig } = require('./config/key');
const { User } = require('./models/User');

async function start() {
    const config = loadConfig();
    await mongoose.connect(config.mongoUri);

    const app = createApp({ User, config });
    const server = app.listen(config.port, () => {
        console.log(`Server listening on port ${config.port}`);
    });

    async function shutdown(signal) {
        console.log(`${signal} received; shutting down`);
        server.close(async () => {
            await mongoose.disconnect();
            process.exit(0);
        });
    }

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));

    return server;
}

if (require.main === module) {
    start().catch((error) => {
        console.error('Server startup failed:', error.message);
        process.exitCode = 1;
    });
}

module.exports = { start };
