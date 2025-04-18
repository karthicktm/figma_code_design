/* SystemJS module definition */
declare var module: NodeModule;

interface NodeModule {
  id: string;
}

// declare namespace Prism {
//   function highlightElement(node: Element);

//   function highlight(response: string, language: string);

//   const languages: string[];
// }

declare module '*/config.json' {
  const value: {
    /**
     * Application insights configuration section
     * https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/microsoft.insights%2Fcomponents
     */
    appInsights: {
      properties: {
        /**
         * Instrumentation key to be set with corresponding Application insights instance setup in Azure cloud.
         */
        InstrumentationKey: string,
      }
    }
  }
  export default value;
}

declare module '*/menu-items.json' {
  const value: {
    title: string;
    uri: string;
    icon?: string;
    children?: MenuInterface[];
  }[];
  export default value;
}

declare module '*/download-data.json' {
  const value: String[];
  export default value;
}

declare module '*.code.json' {
  const value: {
    title: string;
    subtitle?: string;
    id?: string;
    notes?: string;
    html?: string;
    js?: string;
    less?: string;
  };
  export default value;
}

declare module '*.json' {
  const value: any;
  export default value;
}

declare interface SearchItem {
  phrase: string;
  command: 'left' | 'up' | 'right' | 'down' | 'enter' | 'search' | 'focus' | 'blur';
  selected: boolean;
}

declare interface MenuInterface {
  title: string;
  uri: string;
  icon?: string;
  tags?: string[];
  // The required permission if the menu item can be viewed
  canViewPermission?: string;
  // The required permission to access the section
  requiredPermission?: string;
  children?: MenuInterface[];
}

declare interface CodeTooltipInterface {
  data: string;
  action: Array<'modal' | 'link'>;
}

declare enum LanguageType {
  html = 'Markup',
  js = 'JavaScript',
  less = 'LESS',
  ts = 'TypeScript',
  css = 'CSS',
  webcomponent = 'Markup',
  json = 'json',
  customLabel = ''
}

declare interface CodeHolderContent {
  language: LanguageType;
  label: string;
  content: string | any;
}

declare interface CodeHolder {
  showLabel: boolean;
  code: CodeHolderContent[];
}

interface ComponentHost {
  title: string;
  subtitle: string;
  id: string;
  notes: any;
  elements: AngularElement[];
  example: any;
  code: CodeHolder;
  active: LanguageType;
}

interface ComponentContainers {
  html?: string;
  js?: string;
  less?: string;
  ts?: string;
  css?: string;
  webcomponent?: string;
  json?: string;
}

interface AngularElement {
  tag?: string;
  content: string;
  attributes: {
    indeterminate?: string,
    visibility?: string,
    position?: string,
    disabled?: string,
    checked?: string,
    message?: string,
    color?: string,
    icon?: string,
    innerText?: string,
  };
}

interface ComponentItem extends ComponentContainers {
  title: string;
  subtitle?: string;
  id?: string;
  showLabel?: boolean;
  elements?: AngularElement[];
  notes?: string;
  customLabels?: ComponentContainers;
}

interface SwitchInputs {
  disabledState: string;
  enabledState: string;
  defaultState: 'enabled' | 'disabled';
  className?: string;
}

declare class Scripts {
  constructor(element: HTMLElement);
  init(n?: any): void;
  destroy(): void;
}

declare interface VanillaPackage {
  name: string;
  description: string;
  version: string;
  homepage: string;
  author: string;
  repository?: {
    type: string;
    url: string;
  };
  license: string;
  engines?: {
    node: string;
  };
  publishConfig?: {
    registry: string;
  };
  peerDependencies?: {
    [key: string]: string
  };
  dependencies?: {
    [key: string]: string
  };
  devDependencies?: {
    [key: string]: string
  };
  keywords: string[];
}
