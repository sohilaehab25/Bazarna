import { createServer } from 'http';
import { createApp } from './app.module';
import { logger } from './utils/logger';
import { initSocket } from './utils/socket';

const app = createApp();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

initSocket(httpServer);

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});