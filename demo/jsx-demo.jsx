// JSX Demo with build-time compilation
import { jsx, jsxs, Fragment } from '../src/jsx-runtime.js';
import { TXMLTSSRenderer, DefaultConsoleLogger } from '../dist/index.js';

// TSS Styles
const tssStyles = `
scope {
  primaryColor: #4CAF50;
  secondaryColor: #2196F3;
  textColor: #000000;
  accentColor: #FF9800;
  buttonGreen: #32CD32;
  whiteColor: #ffffff;
  blackColor: #000000;
  buttonTextColor: #ffffff;
  greenButtonTextColor: #000000;
}

Window {
  text-color: textColor;
}

Button {
  background-color: primaryColor;
  color: buttonTextColor;
}

#greenButton {
  background-color: buttonGreen;
  color: greenButtonTextColor;
}

Text {
  text-color: textColor;
}

Checkbox {
  text-color: accentColor;
}
`;

// Convert JSX element to TXML string
function jsxToTXML(element) {
  if (!element) return '';
  
  if (typeof element === 'string' || typeof element === 'number') {
    return String(element);
  }
  
  if (Array.isArray(element)) {
    return element.map(jsxToTXML).join('');
  }
  
  if (element.type === 'Fragment') {
    return jsxToTXML(element.props.children);
  }
  
  const { type, props } = element;
  const tagName = typeof type === 'string' ? type : 'Unknown';
  
  let attributes = '';
  if (props) {
    const attrPairs = Object.entries(props)
      .filter(([key, value]) => key !== 'children' && value !== undefined)
      .map(([key, value]) => {
        if (key === 'onClick' && typeof value === 'function') {
          // Register the function and return its ID
          const handlerId = `handler_${Math.random().toString(36).substr(2, 9)}`;
          window.jsxEventHandlerRegistry = window.jsxEventHandlerRegistry || {};
          window.jsxEventHandlerRegistry[handlerId] = value;
          return `onClick="${handlerId}"`;
        }
        return `${key}="${value}"`;
      });
    attributes = attrPairs.length > 0 ? ' ' + attrPairs.join(' ') : '';
  }
  
  const children = props?.children ? jsxToTXML(props.children) : '';
  
  if (children) {
    return `<${tagName}${attributes}>${children}</${tagName}>`;
  } else {
    return `<${tagName}${attributes} />`;
  }
}

// Create the JSX component directly here instead of importing
function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  const [volume, setVolume] = useState(0.5);
  const [enabled, setEnabled] = useState(false);

  return jsx('App', null, [
    jsx('Body', null, [
      jsx('Window', { title: "Build-time JSX Demo" }, [
        jsx('Text', null, "Welcome to Build-time JSX ImGui!"),
        jsx('Text', null, `Count: ${count}`),
        jsx('Button', { onClick: () => setCount(count + 1) }, `Clicked ${count} times`),
        jsx('SameLine', null),
        jsx('Button', { id: "greenButton", onClick: () => console.log('Green button clicked from build-time!') }, "Green Button"),
        jsx('SameLine', null),
        jsx('Checkbox', { label: "Enable Feature", checked: enabled, onChange: setEnabled }),
        jsx('InputText', { label: "Name", hint: "Enter your name", value: name, onChange: setName }),
        jsx('SliderFloat', { label: "Volume", min: 0, max: 1, value: volume, onChange: setVolume })
      ])
    ])
  ]);
}

// Simple useState shim
let _state = {};
let _idCounter = 0;

function useState(initialValue) {
  const id = `state_${_idCounter++}`;
  
  if (_state[id] === undefined) {
    _state[id] = typeof initialValue === 'function' ? initialValue() : initialValue;
  }
  
  const setter = (newValue) => {
    _state[id] = typeof newValue === 'function' ? newValue(_state[id]) : newValue;
  };
  
  return [_state[id], setter];
}

// Initialize the demo
async function initJSXDemo() {
  try {
    console.log('Initializing build-time JSX demo...');
    
    // Create renderer
    const logger = new DefaultConsoleLogger();
    const renderer = new TXMLTSSRenderer(logger);
    
    // Register event handlers
    renderer.registerEventHandler('incrementCount', () => {
      console.log('Count incremented via build-time JSX!');
    });
    
    renderer.registerEventHandler('greenClick', () => {
      console.log('Green button clicked! Build-time JSX working!');
    });
    
    // Convert JSX to TXML
    console.log('Creating JSX element...');
    const jsxElement = App();
    console.log('JSX element created:', jsxElement);
    
    console.log('Converting JSX to TXML...');
    const txml = jsxToTXML(jsxElement);
    console.log('TXML conversion completed');
    
    console.log('Generated TXML from build-time JSX:', txml);
    console.log('TSS Styles:', tssStyles);
    
    // Render the TXML with TSS
    console.log('Rendering TXML with TSS...');
    renderer.render(txml, tssStyles);
    console.log('TXML rendering completed');
    
    console.log('Build-time JSX demo initialized successfully!');
    
    return { txml, tssStyles };
    
  } catch (error) {
    console.error('Failed to initialize build-time JSX demo:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

// Export for build system
export { initJSXDemo, tssStyles };
