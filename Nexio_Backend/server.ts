import express from 'express';
import cors from 'cors';
import { PORT } from './src/config.js';
import routes from './src/routes/index.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(routes);

const server = app.listen(PORT, () => {
  console.log(`\nNexio API → http://localhost:${PORT}`);
  console.log('MVC structure: config → services → controllers → routes\n');
});

server.setTimeout(1_200_000);
server.keepAliveTimeout = 1_200_000;
server.headersTimeout   = 1_210_000;
