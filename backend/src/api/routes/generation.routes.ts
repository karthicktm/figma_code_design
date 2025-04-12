import { Router } from 'express';
import { GenerationController } from '../controllers/generation.controller';

const router = Router();
const generationController = new GenerationController();

/**
 * @route POST /api/generation/generate
 * @desc Generate code based on mappings
 * @access Public
 */
router.post('/generate', generationController.generateCode);

export default router; 
