// src/services/figmaParser.ts (enhanced)
export interface FigmaStyle {
    color?: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: number;
    textAlign?: string;
    fills?: any[];
    strokes?: any[];
    strokeWeight?: number;
    cornerRadius?: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
  }
  
  export interface FigmaNode {
    id: string;
    name: string;
    type: string;
    children?: FigmaNode[];
    componentId?: string;
    absoluteBoundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    style?: FigmaStyle;
    characters?: string;
    visible?: boolean;
    fills?: any[];
    strokes?: any[];
    strokeWeight?: number;
    cornerRadius?: number;
  }
  
  export interface FigmaDocument {
    name: string;
    nodes: Record<string, { document: FigmaNode }>;
    components?: Record<string, any>;
  }
  
  export interface ExtractedComponent {
    type: string;  // Form, Button, TextField, etc.
    name: string;
    node: FigmaNode;
    properties: Record<string, any>;
    children?: ExtractedComponent[];
  }
  
  class FigmaParser {
    parseDocument(jsonData: any): FigmaDocument {
      // Basic validation
      if (!jsonData.name || !jsonData.nodes) {
        throw new Error('Invalid Figma JSON format');
      }
      
      return {
        name: jsonData.name,
        nodes: jsonData.nodes,
        components: jsonData.components || {}
      };
    }
    
    extractComponents(document: FigmaDocument): ExtractedComponent[] {
      const components: ExtractedComponent[] = [];
      
      // Extract the main nodes
      Object.keys(document.nodes).forEach(nodeId => {
        const node = document.nodes[nodeId].document;
        // For the sign-in form, we're looking for the main frame
        if (node.type === 'FRAME' || node.type === 'INSTANCE') {
          // This is likely our main sign-in form
          const signInForm = this.processComponentNode(node, document);
          if (signInForm) {
            components.push(signInForm);
          }
        }
      });
      
      return components;
    }
    
    private processComponentNode(node: FigmaNode, document: FigmaDocument): ExtractedComponent | null {
      // Skip invisible nodes
      if (node.visible === false) {
        return null;
      }
      
      // Process based on node name and type
      if (node.name.toLowerCase().includes('sign in') && (node.type === 'FRAME' || node.type === 'INSTANCE')) {
        // This is our sign-in form
        return this.extractSignInForm(node, document);
      }
      
      // For other components, attempt to identify by name and properties
      const componentType = this.identifyComponentType(node);
      
      if (componentType) {
        const properties = this.extractComponentProperties(node, componentType);
        
        const children: ExtractedComponent[] = [];
        if (node.children) {
          node.children.forEach(child => {
            const childComponent = this.processComponentNode(child, document);
            if (childComponent) {
              children.push(childComponent);
            }
          });
        }
        
        return {
          type: componentType,
          name: node.name,
          node,
          properties,
          children: children.length > 0 ? children : undefined
        };
      }
      
      // If we couldn't identify this component but it has children, 
      // we'll process them as they might be known components
      if (node.children) {
        const childComponents: ExtractedComponent[] = [];
        
        node.children.forEach(child => {
          const childComponent = this.processComponentNode(child, document);
          if (childComponent) {
            childComponents.push(childComponent);
          }
        });
        
        if (childComponents.length > 0) {
          return {
            type: 'Container',
            name: node.name,
            node,
            properties: this.extractComponentProperties(node, 'Container'),
            children: childComponents
          };
        }
      }
      
      return null;
    }
    
    private extractSignInForm(node: FigmaNode, document: FigmaDocument): ExtractedComponent {
      const children: ExtractedComponent[] = [];
      
      // Process children to find form elements
      if (node.children) {
        node.children.forEach(child => {
          if (child.name === 'Header') {
            // Process header
            const headerComponent = this.processComponentNode(child, document);
            if (headerComponent) {
              children.push(headerComponent);
            }
          } else if (child.name === 'Form container') {
            // Process form elements
            const formElements = this.extractFormElements(child, document);
            if (formElements) {
              children.push(formElements);
            }
          } else if (child.name === 'Footer') {
            // Process footer
            const footerComponent = this.processComponentNode(child, document);
            if (footerComponent) {
              children.push(footerComponent);
            }
          }
        });
      }
      
      return {
        type: 'SignInForm',
        name: node.name,
        node,
        properties: this.extractComponentProperties(node, 'SignInForm'),
        children
      };
    }
    
    private extractFormElements(node: FigmaNode, document: FigmaDocument): ExtractedComponent | null {
      if (!node.children) return null;
      
      const children: ExtractedComponent[] = [];
      
      node.children.forEach(child => {
        // Look for text fields, buttons, checkboxes, etc.
        if (child.name.includes('Text field')) {
          // This is a text field
          const textFieldComponent = this.extractTextField(child, document);
          if (textFieldComponent) {
            children.push(textFieldComponent);
          }
        } else if (child.name.includes('Button')) {
          // This is a button
          const buttonComponent = this.extractButton(child, document);
          if (buttonComponent) {
            children.push(buttonComponent);
          }
        } else if (child.name.includes('Checkbox')) {
          // This is a checkbox
          const checkboxComponent = this.extractCheckbox(child, document);
          if (checkboxComponent) {
            children.push(checkboxComponent);
          }
        } else if (child.name.includes('Link')) {
          // This is a link
          const linkComponent = this.extractLink(child, document);
          if (linkComponent) {
            children.push(linkComponent);
          }
        } else {
          // Try processing as a generic component
          const childComponent = this.processComponentNode(child, document);
          if (childComponent) {
            children.push(childComponent);
          }
        }
      });
      
      return {
        type: 'FormContainer',
        name: node.name,
        node,
        properties: this.extractComponentProperties(node, 'FormContainer'),
        children
      };
    }
    
    private extractTextField(node: FigmaNode, document: FigmaDocument): ExtractedComponent | null {
      let placeholder = '';
      let type = 'text';
      let label = '';
      
      // Try to identify if this is a username or password field
      if (node.name.toLowerCase().includes('password')) {
        type = 'password';
      }
      
      // Extract placeholder text from children
      if (node.children) {
        node.children.forEach(child => {
          if (child.name === 'Placeholder' && child.characters) {
            placeholder = child.characters;
          } else if (child.name.includes('Label') && child.characters) {
            label = child.characters;
          }
        });
      }
      
      return {
        type: 'TextField',
        name: node.name,
        node,
        properties: {
          ...this.extractComponentProperties(node, 'TextField'),
          placeholder,
          inputType: type,
          label
        }
      };
    }
    
    private extractButton(node: FigmaNode, document: FigmaDocument): ExtractedComponent | null {
      let text = '';
      let variant = 'primary';
      
      // Extract button text
      if (node.children) {
        node.children.forEach(child => {
          if (child.type === 'TEXT' && child.characters) {
            text = child.characters;
          }
        });
      }
      
      // Determine button variant
      if (node.name.toLowerCase().includes('secondary')) {
        variant = 'secondary';
      } else if (node.name.toLowerCase().includes('ghost')) {
        variant = 'ghost';
      }
      
      return {
        type: 'Button',
        name: node.name,
        node,
        properties: {
          ...this.extractComponentProperties(node, 'Button'),
          text,
          variant
        }
      };
    }
    
    private extractCheckbox(node: FigmaNode, document: FigmaDocument): ExtractedComponent | null {
      let label = '';
      let checked = false;
      
      // Extract checkbox label
      if (node.children) {
        node.children.forEach(child => {
          if (child.name.includes('Option') && child.characters) {
            label = child.characters;
          }
        });
      }
      
      // Determine if checked by default
      if (node.name.toLowerCase().includes('selected')) {
        checked = true;
      }
      
      return {
        type: 'Checkbox',
        name: node.name,
        node,
        properties: {
          ...this.extractComponentProperties(node, 'Checkbox'),
          label,
          checked
        }
      };
    }
    
    private extractLink(node: FigmaNode, document: FigmaDocument): ExtractedComponent | null {
      let text = '';
      
      // Extract link text
      if (node.children) {
        node.children.forEach(child => {
          if (child.type === 'TEXT' && child.characters) {
            text = child.characters;
          }
        });
      }
      
      return {
        type: 'Link',
        name: node.name,
        node,
        properties: {
          ...this.extractComponentProperties(node, 'Link'),
          text
        }
      };
    }
    
    private identifyComponentType(node: FigmaNode): string | null {
      // Identify component type based on name, type, and other properties
      const name = node.name.toLowerCase();
      
      if (name.includes('text field') || name.includes('input')) {
        return 'TextField';
      } else if (name.includes('button')) {
        return 'Button';
      } else if (name.includes('checkbox')) {
        return 'Checkbox';
      } else if (name.includes('link')) {
        return 'Link';
      } else if (name.includes('header')) {
        return 'Header';
      } else if (name.includes('footer')) {
        return 'Footer';
      } else if (node.type === 'TEXT') {
        return 'Text';
      } else if (node.type === 'RECTANGLE' || node.type === 'FRAME') {
        return 'Container';
      }
      
      return null;
    }
    
    private extractComponentProperties(node: FigmaNode, componentType: string): Record<string, any> {
      const properties: Record<string, any> = {};
      
      // Extract common properties
      if (node.absoluteBoundingBox) {
        properties.width = node.absoluteBoundingBox.width;
        properties.height = node.absoluteBoundingBox.height;
      }
      
      // Extract style properties
      if (node.style) {
        if (node.style.fontSize) properties.fontSize = node.style.fontSize;
        if (node.style.fontFamily) properties.fontFamily = node.style.fontFamily;
        if (node.style.fontWeight) properties.fontWeight = node.style.fontWeight;
        if (node.style.textAlign) properties.textAlign = node.style.textAlign;
        
        // Extract colors from fills if available
        if (node.fills && node.fills.length > 0) {
          for (const fill of node.fills) {
            if (fill.type === 'SOLID' && fill.visible !== false) {
              properties.backgroundColor = {
                r: Math.round(fill.color.r * 255),
                g: Math.round(fill.color.g * 255),
                b: Math.round(fill.color.b * 255),
                a: fill.color.a
              };
              break;
            }
          }
        }
        
        // Extract border properties
        if (node.strokes && node.strokes.length > 0) {
          for (const stroke of node.strokes) {
            if (stroke.type === 'SOLID' && stroke.visible !== false) {
              properties.borderColor = {
                r: Math.round(stroke.color.r * 255),
                g: Math.round(stroke.color.g * 255),
                b: Math.round(stroke.color.b * 255),
                a: stroke.color.a
              };
              break;
            }
          }
          if (node.strokeWeight) properties.borderWidth = node.strokeWeight;
        }
        
        // Extract radius
        if (node.cornerRadius) properties.borderRadius = node.cornerRadius;
        
        // Extract padding
        if (node.style.paddingLeft) properties.paddingLeft = node.style.paddingLeft;
        if (node.style.paddingRight) properties.paddingRight = node.style.paddingRight;
        if (node.style.paddingTop) properties.paddingTop = node.style.paddingTop;
        if (node.style.paddingBottom) properties.paddingBottom = node.style.paddingBottom;
      }
      
      // Extract text content
      if (node.type === 'TEXT' && node.characters) {
        properties.text = node.characters;
      }
      
      return properties;
    }
  }
  
  export default new FigmaParser();