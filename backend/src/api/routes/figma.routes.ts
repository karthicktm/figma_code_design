import { Router } from 'express';
import { FigmaController } from '../controllers/figma.controller';

const router = Router();
const figmaController = new FigmaController();

/**
 * @route POST /api/figma/import
 * @desc Import a Figma file
 * @access Public
 */
router.post('/import', figmaController.importFigmaFile);

/**
 * @route POST /api/figma/fetch
 * @desc Fetch a Figma file via API
 * @access Public
 */
router.post('/fetch', figmaController.fetchFigmaFile);

/**
 * @route POST /api/figma/analyze
 * @desc Analyze a Figma design
 * @access Public
 */
router.post('/analyze', figmaController.analyzeDesign);

export default router; 
