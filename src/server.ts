import dotenv from 'dotenv';

import { app } from '@/app.js';
import { createServerValidator } from '@/utils/envValidator.js';

dotenv.config();

// Validate server environment variables
const serverValidator = createServerValidator();
const env = serverValidator.validate();

const PORT: number = env.PORT as number;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
