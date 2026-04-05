import { createApp } from './app.module';
import { logger } from './utils/logger';

const app = createApp();
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});