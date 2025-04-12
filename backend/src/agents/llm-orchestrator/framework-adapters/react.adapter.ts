import { FrameworkAdapter } from './base-adapter';
import { GenerationOptions } from '../../../types/generation.types';
import { Logger } from '../../../config/logger';

export class ReactAdapter extends FrameworkAdapter {
  /**
   * Get default template for a component type
   */
  public getDefaultTemplate(componentType: string, options: GenerationOptions): string {
    const isTs = options.typescript;
    const extension = isTs ? 'tsx' : 'jsx';
    
    switch (componentType.toLowerCase()) {
      case 'button':
        return this.getButtonTemplate(options);
      case 'input':
      case 'textfield':
        return this.getInputTemplate(options);
      case 'card':
        return this.getCardTemplate(options);
      default:
        return this.getGenericTemplate(options);
    }
  }
  public getDefaultLayoutTemplate(options: GenerationOptions): string {
    const isTs = options.typescript;
    
    if (options.styling === 'tailwind') {
      return `import React from 'react';
${isTs ? 'import { FC } from \'react\';' : ''}

// Import components
// Example: import { Button } from './Button';

${isTs ? 'interface LayoutProps {}\n' : ''}
export const Layout${isTs ? ': FC<LayoutProps>' : ''} = () => {
  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Application Title</h1>
      </header>
      
      <main>
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Component Showcase</h2>
          
          <div className="space-y-4">
            {/* Component examples will be placed here */}
          </div>
        </section>
      </main>
      
      <footer className="mt-8 pt-4 border-t text-sm text-gray-600">
        &copy; ${new Date().getFullYear()} Your Company
      </footer>
    </div>
  );
};`;
    } else if (options.styling === 'styled-components') {
      return `import React from 'react';
${isTs ? 'import { FC } from \'react\';' : ''}
import styled from 'styled-components';

// Import components
// Example: import { Button } from './Button';

${isTs ? 'interface LayoutProps {}\n' : ''}

const Container = styled.div\`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
\`;

const Header = styled.header\`
  margin-bottom: 1.5rem;
\`;

const Title = styled.h1\`
  font-size: 1.5rem;
  font-weight: bold;
\`;

const Main = styled.main\`\`;

const Section = styled.section\`
  margin-bottom: 1.5rem;
\`;

const SectionTitle = styled.h2\`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
\`;

const ComponentGroup = styled.div\`
  display: flex;
  flex-direction: column;
  gap: 1rem;
\`;

const Footer = styled.footer\`
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #6b7280;
\`;

export const Layout${isTs ? ': FC<LayoutProps>' : ''} = () => {
  return (
    <Container>
      <Header>
        <Title>Application Title</Title>
      </Header>
      
      <Main>
        <Section>
          <SectionTitle>Component Showcase</SectionTitle>
          
          <ComponentGroup>
            {/* Component examples will be placed here */}
          </ComponentGroup>
        </Section>
      </Main>
      
      <Footer>
        &copy; ${new Date().getFullYear()} Your Company
      </Footer>
    </Container>
  );
};`;
    } else {
      // CSS or CSS Modules
      const cssImport = options.styling === 'css-modules' 
        ? `import styles from './Layout.module.css';` 
        : `import './Layout.css';`;
        
      const cssClass = options.styling === 'css-modules' 
        ? 'styles.container' 
        : 'container';
        
      return `import React from 'react';
${isTs ? 'import { FC } from \'react\';' : ''}
${cssImport}

// Import components
// Example: import { Button } from './Button';

${isTs ? 'interface LayoutProps {}\n' : ''}
export const Layout${isTs ? ': FC<LayoutProps>' : ''} = () => {
  return (
    <div className="${cssClass}">
      <header className="${options.styling === 'css-modules' ? 'styles.header' : 'header'}">
        <h1 className="${options.styling === 'css-modules' ? 'styles.title' : 'title'}">Application Title</h1>
      </header>
      
      <main>
        <section className="${options.styling === 'css-modules' ? 'styles.section' : 'section'}">
          <h2 className="${options.styling === 'css-modules' ? 'styles.sectionTitle' : 'section-title'}">Component Showcase</h2>
          
          <div className="${options.styling === 'css-modules' ? 'styles.componentGroup' : 'component-group'}">
            {/* Component examples will be placed here */}
          </div>
        </section>
      </main>
      
      <footer className="${options.styling === 'css-modules' ? 'styles.footer' : 'footer'}">
        &copy; ${new Date().getFullYear()} Your Company
      </footer>
    </div>
  );
};`;
    }
  }
  
  /**
   * Get file extensions for React
   */
  public getFileExtensions(options: GenerationOptions): string[] {
    const jsExtension = options.typescript ? '.tsx' : '.jsx';
    
    const extensions = [jsExtension];
    
    if (options.styling === 'css' || options.styling === 'css-modules') {
      extensions.push('.css');
    } else if (options.styling === 'scss') {
      extensions.push('.scss');
    }
    
    return extensions;
  }
  
  /**
   * Process file content with React-specific logic
   */
  protected processFileContent(filename: string, content: string, options: GenerationOptions): string {
    let processedContent = content;
    
    // Ensure proper React imports
    if (!processedContent.includes('import React')) {
      processedContent = `import React from 'react';\n${processedContent}`;
    }
    
    // Handle styling imports
    if (options.styling === 'styled-components' && !processedContent.includes('import styled')) {
      processedContent = `import styled from 'styled-components';\n${processedContent}`;
    }
    
    if (options.styling === 'css-modules' && filename.endsWith('.tsx') && !processedContent.includes('import styles')) {
      const cssFilename = filename.replace('.tsx', '.module.css');
      processedContent = `import styles from './${cssFilename.split('/').pop()}';\n${processedContent}`;
    }
    
    // Ensure export statement
    if (!processedContent.includes('export ')) {
      const componentName = filename.split('/').pop()?.split('.')[0] || 'Component';
      if (processedContent.includes(`const ${componentName}`)) {
        processedContent = processedContent.replace(
          `const ${componentName}`,
          `export const ${componentName}`
        );
      } else {
        processedContent += `\n\nexport { ${componentName} };`;
      }
    }
    
    return processedContent;
  }
  
  /**
   * Learn from past errors to improve code generation
   */
  public async learnFromErrors(errors: any[]): Promise<void> {
    Logger.info(`ReactAdapter learning from ${errors.length} errors`);
    
    // Analyze error patterns to refine templates
    const errorMessages = errors.map(err => err.data?.error || '').filter(Boolean);
    
    // Count specific error types
    const errorTypes = {
      importErrors: 0,
      propTypeErrors: 0,
      stylingErrors: 0,
      hookErrors: 0
    };
    
    for (const error of errorMessages) {
      if (error.includes('import') || error.includes('not found')) {
        errorTypes.importErrors++;
      } else if (error.includes('props') || error.includes('PropTypes') || error.includes('type')) {
        errorTypes.propTypeErrors++;
      } else if (error.includes('style') || error.includes('css') || error.includes('className')) {
        errorTypes.stylingErrors++;
      } else if (error.includes('hook') || error.includes('useEffect') || error.includes('useState')) {
        errorTypes.hookErrors++;
      }
    }
    
    // Log findings
    Logger.info('React error patterns analyzed:', errorTypes);
    
    // In a real implementation, we would update the templates based on these findings
    // For now, we'll just log what we'd update
    if (errorTypes.importErrors > 0) {
      Logger.info('Would improve React import handling in templates');
    }
    
    if (errorTypes.propTypeErrors > 0) {
      Logger.info('Would enhance prop types definition in templates');
    }
    
    if (errorTypes.stylingErrors > 0) {
      Logger.info('Would refine styling approach in templates');
    }
    
    if (errorTypes.hookErrors > 0) {
      Logger.info('Would improve React hooks usage in templates');
    }
  }
  
  /**
   * Get button component template
   */
  private getButtonTemplate(options: GenerationOptions): string {
    const isTs = options.typescript;
    
    if (options.styling === 'tailwind') {
      return `import React from 'react';
${isTs ? 'import { FC, ButtonHTMLAttributes } from \'react\';' : ''}

${isTs ? `interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}\n` : ''}

export const Button${isTs ? ': FC<ButtonProps>' : ''} = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}${isTs ? ': ButtonProps' : ''}) => {
  const variantStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    outline: 'bg-transparent border border-blue-500 text-blue-500 hover:bg-blue-50'
  };
  
  const sizeStyles = {
    sm: 'py-1 px-2 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg'
  };
  
  return (
    <button
      className={\`\${variantStyles[variant]} \${sizeStyles[size]} rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 \${className}\`}
      {...props}
    >
      {children}
    </button>
  );
};`;
    } else if (options.styling === 'styled-components') {
      return `import React from 'react';
${isTs ? 'import { FC, ButtonHTMLAttributes } from \'react\';' : ''}
import styled from 'styled-components';

${isTs ? `interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}\n` : ''}

const StyledButton = styled.button${isTs ? '<ButtonProps>' : ''}\`
  font-weight: 500;
  border-radius: 4px;
  transition: all 0.2s;
  
  \${({ variant }) => {
    switch(variant) {
      case 'primary':
        return \`
          background-color: #3b82f6;
          color: white;
          &:hover {
            background-color: #2563eb;
          }
        \`;
      case 'secondary':
        return \`
          background-color: #e5e7eb;
          color: #1f2937;
          &:hover {
            background-color: #d1d5db;
          }
        \`;
      case 'outline':
        return \`
          background-color: transparent;
          border: 1px solid #3b82f6;
          color: #3b82f6;
          &:hover {
            background-color: rgba(59, 130, 246, 0.05);
          }
        \`;
      default:
        return '';
    }
  }}
  
  \${({ size }) => {
    switch(size) {
      case 'sm':
        return \`
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
        \`;
      case 'lg':
        return \`
          padding: 0.75rem 1.5rem;
          font-size: 1.125rem;
        \`;
      default:
        return \`
          padding: 0.5rem 1rem;
          font-size: 1rem;
        \`;
    }
  }}
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
  }
\`;

export const Button${isTs ? ': FC<ButtonProps>' : ''} = ({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}${isTs ? ': ButtonProps' : ''}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      {...props}
    >
      {children}
    </StyledButton>
  );
};`;
    } else {
      // CSS or CSS Modules
      const cssImport = options.styling === 'css-modules' 
        ? `import styles from './Button.module.css';` 
        : `import './Button.css';`;
        
      return `import React from 'react';
${isTs ? 'import { FC, ButtonHTMLAttributes } from \'react\';' : ''}
${cssImport}

${isTs ? `interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}\n` : ''}

export const Button${isTs ? ': FC<ButtonProps>' : ''} = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}${isTs ? ': ButtonProps' : ''}) => {
  const baseClass = ${options.styling === 'css-modules' ? 'styles.button' : '"button"'};
  const variantClass = ${options.styling === 'css-modules' 
    ? `styles[\`button-\${variant}\`]` 
    : `\`button-\${variant}\``};
  const sizeClass = ${options.styling === 'css-modules' 
    ? `styles[\`button-\${size}\`]` 
    : `\`button-\${size}\``};
  
  return (
    <button
      className={\`\${baseClass} \${variantClass} \${sizeClass} \${className}\`}
      {...props}
    >
      {children}
    </button>
  );
};`;
    }
  }
  
  /**
   * Get input/text field component template
   */
  private getInputTemplate(options: GenerationOptions): string {
    const isTs = options.typescript;
    
    if (options.styling === 'tailwind') {
      return `import React from 'react';
${isTs ? 'import { FC, InputHTMLAttributes } from \'react\';' : ''}

${isTs ? `interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}\n` : ''}

export const Input${isTs ? ': FC<InputProps>' : ''} = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}${isTs ? ': InputProps' : ''}) => {
  const id = props.id || \`input-\${Math.random().toString(36).substr(2, 9)}\`;
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={\`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 \${
          error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-blue-500'
        } \${className}\`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};`;
    } else if (options.styling === 'styled-components') {
      return `import React from 'react';
${isTs ? 'import { FC, InputHTMLAttributes } from \'react\';' : ''}
import styled from 'styled-components';

${isTs ? `interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}\n` : ''}

const InputContainer = styled.div\`
  width: 100%;
\`;

const InputLabel = styled.label\`
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
\`;

const StyledInput = styled.input${isTs ? '<{ hasError?: boolean }>' : ''}\`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid \${props => props.hasError ? '#ef4444' : '#d1d5db'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  
  &:focus {
    outline: none;
    border-color: \${props => props.hasError ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 0 0 3px \${props => props.hasError 
      ? 'rgba(239, 68, 68, 0.2)' 
      : 'rgba(59, 130, 246, 0.2)'};
  }
\`;

const ErrorText = styled.p\`
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #ef4444;
\`;

const HelperText = styled.p\`
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
\`;

export const Input${isTs ? ': FC<InputProps>' : ''} = ({
  label,
  error,
  helperText,
  ...props
}${isTs ? ': InputProps' : ''}) => {
  const id = props.id || \`input-\${Math.random().toString(36).substr(2, 9)}\`;
  
  return (
    <InputContainer>
      {label && (
        <InputLabel htmlFor={id}>
          {label}
        </InputLabel>
      )}
      <StyledInput
        id={id}
        hasError={!!error}
        {...props}
      />
      {error && (
        <ErrorText>{error}</ErrorText>
      )}
      {helperText && !error && (
        <HelperText>{helperText}</HelperText>
      )}
    </InputContainer>
  );
};`;
    } else {
      // CSS or CSS Modules
      const cssImport = options.styling === 'css-modules' 
        ? `import styles from './Input.module.css';` 
        : `import './Input.css';`;
        
      return `import React from 'react';
${isTs ? 'import { FC, InputHTMLAttributes } from \'react\';' : ''}
${cssImport}

${isTs ? `interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}\n` : ''}

export const Input${isTs ? ': FC<InputProps>' : ''} = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}${isTs ? ': InputProps' : ''}) => {
  const id = props.id || \`input-\${Math.random().toString(36).substr(2, 9)}\`;
  
  return (
    <div className=${options.styling === 'css-modules' ? 'styles.container' : '"input-container"'}>
      {label && (
        <label 
          htmlFor={id} 
          className=${options.styling === 'css-modules' ? 'styles.label' : '"input-label"'}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={\`${options.styling === 'css-modules' ? 'styles.input' : 'input'} \${
          error 
            ? ${options.styling === 'css-modules' ? 'styles.inputError' : '"input-error"'} 
            : ''
        } \${className}\`}
        {...props}
      />
      {error && (
        <p className=${options.styling === 'css-modules' ? 'styles.errorText' : '"input-error-text"'}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className=${options.styling === 'css-modules' ? 'styles.helperText' : '"input-helper-text"'}>
          {helperText}
        </p>
      )}
    </div>
  );
};`;
    }
  }
  
  /**
   * Get card component template
   */
  private getCardTemplate(options: GenerationOptions): string {
    const isTs = options.typescript;
    
    if (options.styling === 'tailwind') {
      return `import React from 'react';
${isTs ? 'import { FC, HTMLAttributes, ReactNode } from \'react\';' : ''}

${isTs ? `interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}\n` : ''}

export const Card${isTs ? ': FC<CardProps>' : ''} = ({
  title,
  subtitle,
  footer,
  children,
  className = '',
  ...props
}${isTs ? ': CardProps' : ''}) => {
  return (
    <div
      className={\`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden \${className}\`}
      {...props}
    >
      {(title || subtitle) && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      
      <div className="px-4 py-5 sm:p-6">
        {children}
      </div>
      
      {footer && (
        <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};`;
    } else if (options.styling === 'styled-components') {
      return `import React from 'react';
${isTs ? 'import { FC, HTMLAttributes, ReactNode } from \'react\';' : ''}
import styled from 'styled-components';

${isTs ? `interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}\n` : ''}

const CardContainer = styled.div\`
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
\`;

const CardHeader = styled.div\`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
\`;

const CardTitle = styled.h3\`
  font-size: 1.125rem;
  font-weight: 500;
  color: #111827;
\`;

const CardSubtitle = styled.p\`
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
\`;

const CardBody = styled.div\`
  padding: 1.25rem 1.5rem;
\`;

const CardFooter = styled.div\`
  padding: 1rem 1.5rem;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
\`;

export const Card${isTs ? ': FC<CardProps>' : ''} = ({
  title,
  subtitle,
  footer,
  children,
  ...props
}${isTs ? ': CardProps' : ''}) => {
  return (
    <CardContainer {...props}>
      {(title || subtitle) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
        </CardHeader>
      )}
      
      <CardBody>
        {children}
      </CardBody>
      
      {footer && (
        <CardFooter>
          {footer}
        </CardFooter>
      )}
    </CardContainer>
  );
};`;
    } else {
      // CSS or CSS Modules
      const cssImport = options.styling === 'css-modules' 
        ? `import styles from './Card.module.css';` 
        : `import './Card.css';`;
        
      return `import React from 'react';
${isTs ? 'import { FC, HTMLAttributes, ReactNode } from \'react\';' : ''}
${cssImport}

${isTs ? `interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}\n` : ''}

export const Card${isTs ? ': FC<CardProps>' : ''} = ({
  title,
  subtitle,
  footer,
  children,
  className = '',
  ...props
}${isTs ? ': CardProps' : ''}) => {
  return (
    <div
      className={\`${options.styling === 'css-modules' ? 'styles.card' : 'card'} \${className}\`}
      {...props}
    >
      {(title || subtitle) && (
        <div className=${options.styling === 'css-modules' ? 'styles.cardHeader' : '"card-header"'}>
          {title && <h3 className=${options.styling === 'css-modules' ? 'styles.cardTitle' : '"card-title"'}>{title}</h3>}
          {subtitle && <p className=${options.styling === 'css-modules' ? 'styles.cardSubtitle' : '"card-subtitle"'}>{subtitle}</p>}
        </div>
      )}
      
      <div className=${options.styling === 'css-modules' ? 'styles.cardBody' : '"card-body"'}>
        {children}
      </div>
      
      {footer && (
        <div className=${options.styling === 'css-modules' ? 'styles.cardFooter' : '"card-footer"'}>
          {footer}
        </div>
      )}
    </div>
  );
};`;
    }
  }
  
  /**
   * Get generic component template
   */
  private getGenericTemplate(options: GenerationOptions): string {
    const isTs = options.typescript;
    
    if (options.styling === 'tailwind') {
      return `import React from 'react';
${isTs ? 'import { FC, HTMLAttributes, ReactNode } from \'react\';' : ''}

${isTs ? `interface GenericProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}\n` : ''}

export const Component${isTs ? ': FC<GenericProps>' : ''} = ({
  children,
  className = '',
  ...props
}${isTs ? ': GenericProps' : ''}) => {
  return (
    <div
      className={\`p-4 \${className}\`}
      {...props}
    >
      {children}
    </div>
  );
};`;
    } else if (options.styling === 'styled-components') {
      return `import React from 'react';
${isTs ? 'import { FC, HTMLAttributes, ReactNode } from \'react\';' : ''}
import styled from 'styled-components';

${isTs ? `interface GenericProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}\n` : ''}

const Container = styled.div\`
  padding: 1rem;
\`;

export const Component${isTs ? ': FC<GenericProps>' : ''} = ({
  children,
  ...props
}${isTs ? ': GenericProps' : ''}) => {
  return (
    <Container {...props}>
      {children}
    </Container>
  );
};`;
    } else {
      // CSS or CSS Modules
      const cssImport = options.styling === 'css-modules' 
        ? `import styles from './Component.module.css';` 
        : `import './Component.css';`;
        
      return `import React from 'react';
${isTs ? 'import { FC, HTMLAttributes, ReactNode } from \'react\';' : ''}
${cssImport}

${isTs ? `interface GenericProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}\n` : ''}

export const Component${isTs ? ': FC<GenericProps>' : ''} = ({
  children,
  className = '',
  ...props
}${isTs ? ': GenericProps' : ''}) => {
  return (
    <div
      className={\`${options.styling === 'css-modules' ? 'styles.container' : 'component'} \${className}\`}
      {...props}
    > 
     {children}
    </div>
  );
};`;
    }
  }
}