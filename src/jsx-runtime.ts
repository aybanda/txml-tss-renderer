// JSX runtime for TXML generation

import { TXMLElement } from './types.js';

// Global handler registry for JSX inline event functions (e.g., onClick)
function getGlobalHandlerRegistry(): Record<string, Function> {
  const g = globalThis as any;
  if (!g.__txmlJsxHandlers) {
    g.__txmlJsxHandlers = Object.create(null);
  }
  return g.__txmlJsxHandlers as Record<string, Function>;
}

function getNextHandlerId(): string {
  const g = globalThis as any;
  if (typeof g.__txmlJsxHandlerSeq !== 'number') {
    g.__txmlJsxHandlerSeq = 0;
  }
  g.__txmlJsxHandlerSeq += 1;
  return `jsx_fn_${g.__txmlJsxHandlerSeq}`;
}

// JSX factory function
export function jsx(type: string, props: any, key?: any): TXMLElement {
  // Runtime type validation
  if (typeof type !== 'string') {
    throw new Error(`JSX type must be a string, got ${typeof type}`);
  }
  
  const attributes: Record<string, string> = {};
  const children: (TXMLElement | string)[] = [];

  // Handle children from props.children or key parameter
  if (props && props.children !== undefined) {
    if (Array.isArray(props.children)) {
      children.push(
        ...props.children
          .filter((child: any) => child !== null && child !== undefined && child !== false)
          .map((child: any) => (typeof child === 'number' || typeof child === 'boolean' ? String(child) : child))
      );
    } else if (props.children !== null && props.children !== undefined) {
      const ch: any = props.children;
      children.push(typeof ch === 'number' || typeof ch === 'boolean' ? String(ch) : ch);
    }
  } else if (key !== undefined) {
    // JSX passes children as the third parameter (key)
    if (Array.isArray(key)) {
      children.push(
        ...key
          .filter((child: any) => child !== null && child !== undefined && child !== false)
          .map((child: any) => (typeof child === 'number' || typeof child === 'boolean' ? String(child) : child))
      );
    } else if (key !== null && key !== undefined) {
      children.push(typeof key === 'number' || typeof key === 'boolean' ? String(key) : (key as any));
    }
  }

  // Convert props to attributes
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (key === 'children') {
        // Already handled above
        continue;
      } else if (key === 'key') {
        // Skip React key prop
        continue;
      } else {
        // Event handler: register function in global registry and serialize handler name
        if (typeof value === 'function' && /^on[A-Z]/.test(key)) {
          const registry = getGlobalHandlerRegistry();
          const handlerId = getNextHandlerId();
          registry[handlerId] = value as Function;
          attributes[key] = handlerId;
          continue;
        }

        // Convert other values to string
        attributes[key] = String(value);
      }
    }
  }

  return {
    tag: type,
    attributes,
    children
  };
}

// JSX factory for multiple children
export function jsxs(type: string, props: any, ...children: any[]): TXMLElement {
  // Runtime type validation
  if (typeof type !== 'string') {
    throw new Error(`JSX type must be a string, got ${typeof type}`);
  }
  
  const attributes: Record<string, string> = {};
  const processedChildren: (TXMLElement | string)[] = [];

  // Process children - handle both array and individual parameters
  children.forEach(child => {
    if (Array.isArray(child)) {
      // If child is an array, process each item in the array
      child.forEach(arrayChild => {
        if (arrayChild !== null && arrayChild !== undefined && arrayChild !== false) {
          if (typeof arrayChild === 'number' || typeof arrayChild === 'boolean') {
            processedChildren.push(String(arrayChild));
          } else {
            processedChildren.push(arrayChild);
          }
        }
      });
    } else if (child !== null && child !== undefined && child !== false) {
      if (typeof child === 'number' || typeof child === 'boolean') {
        processedChildren.push(String(child));
      } else {
        processedChildren.push(child);
      }
    }
  });

  // Convert props to attributes
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (key === 'children') {
        // Handle children from props if present
        if (Array.isArray(value)) {
          value.forEach(child => {
            if (child !== null && child !== undefined && child !== false) {
              if (typeof child === 'number' || typeof child === 'boolean') {
                processedChildren.push(String(child));
              } else {
                processedChildren.push(child);
              }
            }
          });
        } else if (value !== null && value !== undefined) {
          if (typeof value === 'number' || typeof value === 'boolean') {
            processedChildren.push(String(value));
          } else {
            processedChildren.push(value as TXMLElement | string);
          }
        }
        continue;
      } else if (key === 'key') {
        // Skip React key prop
        continue;
      } else {
        // Event handler: register function in global registry and serialize handler name
        if (typeof value === 'function' && /^on[A-Z]/.test(key)) {
          const registry = getGlobalHandlerRegistry();
          const handlerId = getNextHandlerId();
          registry[handlerId] = value as Function;
          attributes[key] = handlerId;
          continue;
        }

        // Convert other values to string
        attributes[key] = String(value);
      }
    }
  }

  return {
    tag: type,
    attributes,
    children: processedChildren
  };
}

// Fragment support
export const Fragment = Symbol('Fragment');

// Allowed tag names for security validation
const ALLOWED_TAGS = new Set([
  'App', 'Head', 'Body', 'Window', 'Text', 'Button', 'InputText', 
  'SliderFloat', 'Checkbox', 'SameLine', 'Separator', 'Spacing'
]);

// Allowed attribute names for security validation
const ALLOWED_ATTRIBUTES = new Set([
  'title', 'label', 'hint', 'value', 'min', 'max', 'checked', 
  'onClick', 'onChange', 'id', 'width', 'height', 'color', 
  'background-color', 'text-color'
]);

// Validate and sanitize tag name
function validateTagName(tag: string): string {
  if (!tag || typeof tag !== 'string') {
    throw new Error('Invalid tag name: must be a non-empty string');
  }
  
  // Remove any potentially dangerous characters
  const sanitized = tag.replace(/[<>'"&]/g, '');
  
  if (!ALLOWED_TAGS.has(sanitized)) {
    console.warn(`Unknown tag: ${sanitized}. Allowed tags: ${Array.from(ALLOWED_TAGS).join(', ')}`);
    return 'UnknownTag'; // Safe fallback
  }
  
  return sanitized;
}

// Validate and sanitize attribute name
function validateAttributeName(key: string): string {
  if (!key || typeof key !== 'string') {
    throw new Error('Invalid attribute name: must be a non-empty string');
  }
  
  // Remove any potentially dangerous characters
  const sanitized = key.replace(/[<>'"&]/g, '');
  
  if (!ALLOWED_ATTRIBUTES.has(sanitized)) {
    console.warn(`Unknown attribute: ${sanitized}. Allowed attributes: ${Array.from(ALLOWED_ATTRIBUTES).join(', ')}`);
    return 'unknown-attr'; // Safe fallback
  }
  
  return sanitized;
}

// Helper function to convert JSX to TXML string
export function jsxToTXML(element: TXMLElement): string {
  if (element == null) {
    return '';
  }

  if (typeof element === 'string' || typeof element === 'number' || typeof element === 'boolean') {
    return String(element);
  }

  // Runtime type validation for TXMLElement
  if (typeof element !== 'object' || Array.isArray(element)) {
    throw new Error(`jsxToTXML: element must be a TXMLElement object, got ${typeof element}`);
  }

  if (!element.tag || typeof element.tag !== 'string') {
    throw new Error(`jsxToTXML: element.tag must be a string, got ${typeof element.tag}`);
  }

  if (!element.attributes || typeof element.attributes !== 'object' || Array.isArray(element.attributes)) {
    throw new Error(`jsxToTXML: element.attributes must be an object, got ${typeof element.attributes}`);
  }

  if (!element.children || !Array.isArray(element.children)) {
    throw new Error(`jsxToTXML: element.children must be an array, got ${typeof element.children}`);
  }

  const { tag, attributes, children } = element;
  
  // Validate and sanitize tag name
  const safeTag = validateTagName(tag);
  
  // Build attributes string with proper escaping and validation
  const attrsStr = Object.entries(attributes || {})
    .map(([key, value]) => {
      const safeKey = validateAttributeName(key);
      const escapedValue = String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `${safeKey}="${escapedValue}"`;
    })
    .join(' ');

  // Build children string
  const childrenStr = (children || [])
    .map(child => jsxToTXML(child as any))
    .join('');

  if (!children || children.length === 0) {
    return `<${safeTag}${attrsStr ? ' ' + attrsStr : ''} />`;
  }

  return `<${safeTag}${attrsStr ? ' ' + attrsStr : ''}>${childrenStr}</${safeTag}>`;
}

// Example usage:
/*
// This JSX:
const App = () => (
  <App>
    <Head />
    <Body>
      <Window title="My App">
        <Text>Hello, JSX!</Text>
        <Button onClick="handleClick">Click Me</Button>
      </Window>
    </Body>
  </App>
);

// Compiles to:
const App = () => jsxs("App", null, jsxs("Head", null), jsxs("Body", null, 
  jsxs("Window", { title: "My App" }, 
    jsx("Text", null, "Hello, JSX!"),
    jsx("Button", { onClick: "handleClick" }, "Click Me")
  )
));

// Can be converted to TXML:
const txml = jsxToTXML(App());
*/

// React-like hooks for JSX components
let stateId = 0;
const stateMap = new Map<string, any>();

export function useState<T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Runtime type validation for initialValue
  if (initialValue === null || initialValue === undefined) {
    throw new Error(`useState: initialValue cannot be null or undefined`);
  }
  
  const id = `state_${stateId++}`;
  
  if (!stateMap.has(id)) {
    stateMap.set(id, typeof initialValue === 'function' ? (initialValue as Function)() : initialValue);
  }
  
  const setValue = (value: T | ((prev: T) => T)) => {
    // Runtime type validation for setValue
    if (value === null || value === undefined) {
      throw new Error(`useState: setValue cannot accept null or undefined`);
    }
    
    const currentValue = stateMap.get(id);
    const newValue = typeof value === 'function' ? (value as Function)(currentValue) : value;
    stateMap.set(id, newValue);
  };
  
  return [stateMap.get(id), setValue];
}

// Simple root renderer
export function createRoot(container: HTMLElement) {
  return {
    render: (element: TXMLElement) => {
      // Convert JSX element to TXML and render
      const txml = jsxToTXML(element);
      console.log('Rendered TXML:', txml);
      // In a real implementation, this would render to the container
      if (container) {
        container.textContent = txml;
      }
      return txml;
    }
  };
}
