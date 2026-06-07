import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import buildsRouter from './server/routes/builds.js';
import themesRouter from './server/routes/themes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

app.use('/api/builds', buildsRouter);
app.use('/api/themes', themesRouter);

app.use(express.static(path.join(__dirname, 'client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Cube Critic running at http://localhost:${PORT}`);
});
