import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Logger } from './config/logger';
import figmaRoutes from './api/routes/figma.routes';
import edsRoutes from './api/routes/eds.routes';
import mappingRoutes from './api/routes/mapping.routes';
import generationRoutes from './api/routes/generation.routes';
import validationRoutes from './api/routes/validation.routes';
import { errorMiddleware } from './api/middleware/error.middleware';
import { loggerMiddleware } from './api/middleware/logger.middleware';
import { FigmaParserAgent } from './agents/figma-parser/parser.agent';
import { DesignAnalyzerAgent } from './agents/design-analyzer/analyzer.agent';
import { EDSMapperAgent } from './agents/eds-mapper/mapper.agent';
import { LLMOrchestratorAgent } from './agents/llm-orchestrator/orchestrator.agent';
import { CodeValidatorAgent } from './agents/code-validator/validator.agent';
import { AgentRegistry } from './agents/base/agent-registry';

// Initialize agents
const figmaParser = new FigmaParserAgent({
  name: 'Figma Parser',
  description: 'Parses Figma files to extract design information'
});

const designAnalyzer = new DesignAnalyzerAgent({
  name: 'Design Analyzer',
  description: 'Analyzes designs to detect patterns and validate styles'
});

const edsMapper = new EDSMapperAgent({
  name: 'EDS Mapper',
  description: 'Maps Figma components to Enterprise Design System components'
});

const llmOrchestrator = new LLMOrchestratorAgent({
  name: 'LLM Orchestrator',
  description: 'Orchestrates code generation using LLMs'
});

const codeValidator = new CodeValidatorAgent({
  name: 'Code Validator',
  description: 'Validates generated code for syntax, style, and responsiveness'
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(loggerMiddleware);

// Routes
app.use('/api/figma', figmaRoutes);
app.use('/api/eds', edsRoutes);
app.use('/api/mapping', mappingRoutes);
app.use('/api/generation', generationRoutes);
app.use('/api/validation', validationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const agentStates = AgentRegistry.getAllAgentStates();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    agents: agentStates.map(state => ({
      id: state.id,
      name: state.name,
      status: state.status,
      successRate: state.successRate
    }))
  });
});

// Error handling
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  Logger.info(`Server running on port ${PORT}`);
});

export default app;
