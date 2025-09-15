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
export function jsxs(type: string, props: any, _key?: any): TXMLElement {
  return jsx(type, props, _key);
}

// Fragment support
export const Fragment = Symbol('Fragment');

// Helper function to convert JSX to TXML string
export function jsxToTXML(element: TXMLElement): string {
  if (element == null) {
    return '';
  }

  if (typeof element === 'string' || typeof element === 'number' || typeof element === 'boolean') {
    return element;
  }

  const { tag, attributes, children } = element;
  
  // Build attributes string with proper escaping
  const attrsStr = Object.entries(attributes || {})
    .map(([key, value]) => {
      const escapedValue = String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `${key}="${escapedValue}"`;
    })
    .join(' ');

  // Build children string
  const childrenStr = (children || [])
    .map(child => jsxToTXML(child as any))
    .join('');

  if (!children || children.length === 0) {
    return `<${tag}${attrsStr ? ' ' + attrsStr : ''} />`;
  }

  return `<${tag}${attrsStr ? ' ' + attrsStr : ''}>${childrenStr}</${tag}>`;
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
  const id = `state_${stateId++}`;
  
  if (!stateMap.has(id)) {
    stateMap.set(id, typeof initialValue === 'function' ? (initialValue as Function)() : initialValue);
  }
  
  const setValue = (value: T | ((prev: T) => T)) => {
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
