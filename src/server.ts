import { app } from '@/app.js';
import { databaseConnection } from '@/config/postgres.js';
import { createServerValidator } from '@/utils/envValidator.js';

const startServer = async () => {
  try {
    console.log('Connecting to the database...');
    await databaseConnection.connect();

    const serverValidator = createServerValidator();
    const env = serverValidator.validate();
    const PORT: number = env.PORT as number;

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();
