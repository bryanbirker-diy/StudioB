import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { addBuild, loadGallery, getBuild, updateBuild } from '../storage/gallery.js';
import { generateReview, assignBadge } from '../services/reviewer.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const builds = await loadGallery();
    res.json(builds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load gallery' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const build = await getBuild(req.params.id);
    if (!build) return res.status(404).json({ error: 'Build not found' });
    res.json(build);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load build' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { theme, cubes } = req.body;
    if (!theme || !Array.isArray(cubes)) {
      return res.status(400).json({ error: 'theme and cubes are required' });
    }

    const review = generateReview(theme, cubes);
    const badge = assignBadge(theme, cubes);

    const build = {
      id: uuidv4(),
      theme,
      createdAt: new Date().toISOString(),
      cubes,
      review,
      badge,
      votes: { creative: 0, funny: 0, color: 0, impressive: 0 },
    };

    await addBuild(build);
    res.status(201).json(build);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save build' });
  }
});

router.post('/:id/vote', async (req, res) => {
  try {
    const { category } = req.body;
    const valid = ['creative', 'funny', 'color', 'impressive'];
    if (!valid.includes(category)) {
      return res.status(400).json({ error: 'Invalid vote category' });
    }

    const build = await getBuild(req.params.id);
    if (!build) return res.status(404).json({ error: 'Build not found' });

    const updatedVotes = { ...build.votes, [category]: build.votes[category] + 1 };
    const updated = await updateBuild(req.params.id, { votes: updatedVotes });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

export default router;
