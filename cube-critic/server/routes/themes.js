import { Router } from 'express';
import { getRandomTheme } from '../services/themes.js';

const router = Router();

router.get('/random', (req, res) => {
  res.json({ theme: getRandomTheme() });
});

export default router;
