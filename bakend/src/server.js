const app = require('./app');
const pool = require('./config/db');
const env = require('./config/env');

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection verified.');

    const port = Number(env.port) || 5000;

    app.listen(port, () => {
      console.log(`Wake Cake API running on port ${port}`);
    });

  } catch (error) {
    console.error('Failed to start server:');
    console.error(error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();
