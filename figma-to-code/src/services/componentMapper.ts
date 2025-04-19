// src/services/componentMapper.ts
import { ExtractedComponent } from './figmaParser';

export interface EdsComponent {
  type: string;  // The EDS component type (e.g., Card, Button, etc.)
  properties: Record<string, any>;
  children?: EdsComponent[];
}

class ComponentMapper {
  mapComponents(figmaComponents: ExtractedComponent[]): EdsComponent[] {
    return figmaComponents.map(component => this.mapComponent(component));
  }
  
  private mapComponent(component: ExtractedComponent): EdsComponent {
    switch (component.type) {
      case 'SignInForm':
        return this.mapSignInForm(component);
      case 'FormContainer':
        return this.mapFormContainer(component);
      case 'TextField':
        return this.mapTextField(component);
      case 'Button':
        return this.mapButton(component);
      case 'Checkbox':
        return this.mapCheckbox(component);
      case 'Link':
        return this.mapLink(component);
      case 'Header':
        return this.mapHeader(component);
      case 'Footer':
        return this.mapFooter(component);
      case 'Text':
        return this.mapText(component);
      case 'Container':
      default:
        return this.mapContainer(component);
    }
  }
  
  private mapSignInForm(component: ExtractedComponent): EdsComponent {
    const children = component.children 
      ? component.children.map(child => this.mapComponent(child)) 
      : [];
      
    return {
      type: 'div', // We'll use a standard div for the form container
      properties: {
        className: 'sign-in-container',
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px',
          backgroundColor: '#0c0c0c', // Dark background from the design
        }
      },
      children
    };
  }
  
  private mapFormContainer(component: ExtractedComponent): EdsComponent {
    const children = component.children 
      ? component.children.map(child => this.mapComponent(child)) 
      : [];
      
    return {
      type: 'form',
      properties: {
        className: 'eds-form',
        style: {
          width: '100%',
          maxWidth: '400px',
        }
      },
      children
    };
  }
  
  private mapTextField(component: ExtractedComponent): EdsComponent {
    const { placeholder, inputType, label } = component.properties;
    
    return {
      type: 'TextFieldComponent',
      properties: {
        label: label || undefined,
        placeholder: placeholder || '',
        type: inputType || 'text',
        required: true,
        fullWidth: true
      }
    };
  }
  
  private mapButton(component: ExtractedComponent): EdsComponent {
    const { text, variant } = component.properties;
    
    return {
      type: 'ButtonComponent',
      properties: {
        label: text || 'Button',
        type: 'submit',
        variant: variant || 'primary',
        fullWidth: true
      }
    };
  }
  
  private mapCheckbox(component: ExtractedComponent): EdsComponent {
    const { label, checked } = component.properties;
    
    return {
      type: 'CheckboxComponent',
      properties: {
        label: label || 'Checkbox',
        defaultChecked: checked || false
      }
    };
  }
  
  private mapLink(component: ExtractedComponent): EdsComponent {
    const { text } = component.properties;
    
    return {
      type: 'LinkComponent',
      properties: {
        label: text || 'Link',
        href: '#',
        style: {
          display: 'block',
          textAlign: 'center',
          marginTop: '16px'
        }
      }
    };
  }
  
  private mapHeader(component: ExtractedComponent): EdsComponent {
    // Map the header component, which might contain logo, title, etc.
    const children = component.children 
      ? component.children.map(child => this.mapComponent(child)) 
      : [];
      
    return {
      type: 'HeaderComponent',
      properties: {
        className: 'eds-header'
      },
      children
    };
  }
  
  private mapFooter(component: ExtractedComponent): EdsComponent {
    // Map the footer component
    let footerText = '';
    
    if (component.properties.text) {
      footerText = component.properties.text;
    }
    
    return {
      type: 'FooterComponent',
      properties: {
        text: footerText,
        className: 'eds-footer',
        style: {
          textAlign: 'center',
          fontSize: '14px',
          color: '#ffffff',
          marginTop: '32px'
        }
      }
    };
  }
  
  private mapText(component: ExtractedComponent): EdsComponent {
    const { text, fontSize, fontWeight, textAlign } = component.properties;
    
    return {
      type: 'TextComponent',
      properties: {
        text: text || '',
        style: {
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontWeight: fontWeight || undefined,
          textAlign: textAlign || undefined
        }
      }
    };
  }
  
  private mapContainer(component: ExtractedComponent): EdsComponent {
    const children = component.children 
      ? component.children.map(child => this.mapComponent(child)) 
      : [];
      
    return {
      type: 'div',
      properties: {
        className: `container-${component.name.toLowerCase().replace(/\s+/g, '-')}`,
        style: {}
      },
      children
    };
  }
}

export default new ComponentMapper();