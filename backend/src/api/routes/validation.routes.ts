import { Router } from 'express';
import { ValidationController } from '../controllers/validation.controller';

const router = Router();
const validationController = new ValidationController();

/**
 * @route POST /api/validation/validate
 * @desc Validate generated code
 * @access Public
 */
router.post('/validate', validationController.validateCode);

export default router; 
