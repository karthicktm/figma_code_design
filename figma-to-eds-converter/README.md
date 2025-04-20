# Figma to EDS Angular Converter

A multi-agent application that converts Figma designs to Angular components using the Ericsson Design System (EDS).

## Features

- Upload Figma designs via the Figma API
- Identify components and design patterns
- Extract design tokens and styles
- Generate Angular components with EDS integration
- Manage assets like images, icons, and fonts
- Download the complete Angular project

## Architecture

The application is built using a multi-agent system:

1. **Design Input Agent**: Extracts data from Figma designs
2. **Asset Manager Agent**: Processes and downloads design assets
3. **Component Recognition Agent**: Identifies UI components in the design
4. **Style Extraction Agent**: Extracts design tokens and styles
5. **Code Generation Agent**: Generates Angular components with EDS integration
6. **Output & Preview Agent**: Prepares final code output and preview

## Tech Stack

- Next.js with React
- TypeScript
- Tailwind CSS
- Shadcn UI Components
- Zustand for state management
- Azure OpenAI for code generation
- Figma API for design extraction

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Figma API key
- Azure OpenAI API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/figma-to-eds-converter.git
   cd figma-to-eds-converter
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter your Figma API key and file URL/ID
2. Configure Azure OpenAI settings
3. Start the conversion process
4. Monitor workflow progress
5. Upload any missing assets if prompted
6. Preview and download the generated Angular code

## Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_FIGMA_API_KEY=your_default_figma_api_key
NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
NEXT_PUBLIC_AZURE_OPENAI_API_KEY=your_azure_openai_api_key
NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT=your_deployment_name
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.