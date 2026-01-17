import { Router } from 'express';
import Workshop from '../models/Workshop.js';
import { generateBehaviors } from '../services/agents/designer.js';
import { checkIsBehavior } from '../services/agents/validator.js';
import { getNextQuestion, getFinalEvaluation } from '../services/agents/coach.js';
import { generateSOP } from '../services/agents/sop.js';

const router = Router();

// List all workshops (visions)
router.get('/all', async (req, res) => {
  try {
    const workshops = await Workshop.find({}, 'vision createdAt updatedAt').sort({ updatedAt: -1 });
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load visions' });
  }
});

// Load a specific workshop
router.get('/:id', async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({ error: 'Workshop not found' });
    }
    res.json(workshop);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load workshop' });
  }
});

// Create a new workshop
router.post('/create', async (req, res) => {
  try {
    const { vision } = req.body;
    const workshop = await Workshop.create({ vision: vision || '', behaviors: [] });
    res.json(workshop);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workshop' });
  }
});

// Delete a workshop
router.delete('/:id', async (req, res) => {
  try {
    await Workshop.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete workshop' });
  }
});

// Save the workshop state (updated to use ID)
router.post('/save/:id', async (req, res) => {
  try {
    const { vision, behaviors, sopData } = req.body;
    const workshop = await Workshop.findById(req.params.id);
    if (workshop) {
      workshop.vision = vision;
      workshop.behaviors = behaviors;
      workshop.sopData = sopData;
      await workshop.save();
      res.json(workshop);
    } else {
      res.status(404).json({ error: 'Workshop not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to save workshop' });
  }
});

// Original singleton route (kept for compatibility or redirected)
router.get('/', async (req, res) => {
  try {
    let workshop = await Workshop.findOne().sort({ updatedAt: -1 });
    if (!workshop) {
      workshop = await Workshop.create({ vision: '', behaviors: [] });
    }
    res.json(workshop);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load workshop' });
  }
});

// Generate behaviors
router.post('/generate', async (req, res) => {
  const { vision, language, excludeTexts } = req.body;
  try {
    const behaviors = await generateBehaviors(vision, language, excludeTexts);
    res.json(behaviors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate behaviors' });
  }
});

// Validate a behavior
router.post('/validate', async (req, res) => {
  const { behavior, vision, language } = req.body;
  try {
    const result = await checkIsBehavior(behavior, vision, language);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate behavior' });
  }
});

// Coach: get next question
router.post('/coach/next', async (req, res) => {
  const { behavior, vision, history, language, validatorCritique } = req.body;
  try {
    // Note: getNextQuestion uses streaming internally, but for simplicity here we return the full text
    // If streaming is needed, we would need to adjust the response handling
    const result = await getNextQuestion(
      behavior,
      vision,
      history,
      () => {}, // Empty chunk handler for non-streaming response
      language,
      validatorCritique
    );
    res.json({ content: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get next question' });
  }
});

// Coach: get final evaluation
router.post('/coach/final', async (req, res) => {
  const { behavior, vision, history, language } = req.body;
  try {
    const result = await getFinalEvaluation(behavior, vision, history, undefined, language);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get final evaluation' });
  }
});

// Generate SOP
router.post('/sop', async (req, res) => {
  const { vision, behaviors, language } = req.body;
  try {
    const result = await generateSOP(vision, behaviors, language);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate SOP' });
  }
});

export default router;
