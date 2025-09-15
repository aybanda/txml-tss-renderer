import { createRoot, useState, jsx, jsxs, Fragment, jsxToTXML } from '../dist/index.js';
 
function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  const [volume, setVolume] = useState(0.5);
  const [enabled, setEnabled] = useState(false);
 
  // const App = MyApp;
  const Body = "Body";
  const Window = "Window";
  const Text = "Text";
  const Button = "Button";
  const SameLine = "SameLine";
  const Checkbox = "Checkbox";
  const InputText = "InputText";
  const SliderFloat = "SliderFloat";
 
  return (
    <App>
      <Body>
        <Window title="JSX ImGui Demo">
          <Text>Welcome to JSX ImGui!</Text>
          <Text>Count: {count}</Text>
          <Button onClick={() => setCount(count + 1)}>
            Clicked {count} times
          </Button>
          <SameLine />
          <Checkbox 
            label="Enable Feature" 
            checked={enabled}
            onChange={setEnabled}
          />
          <InputText 
            label="Name" 
            hint="Enter your name"
            value={name}
            onChange={setName}
          />
          <SliderFloat 
            label="Volume" 
            min={0} 
            max={1}
            value={volume}
            onChange={setVolume}
          />
        </Window>
      </Body>
    </App>
  );
}
 
// var App = MyApp;
export default App;

// Export function for build-time-jsx-demo.html
export async function initJSXDemo() {
  try {
    console.log('Initializing build-time JSX demo...');
    
    // Convert JSX to TXML
    console.log('Creating JSX element...');
    const jsxElement = App();
    console.log('JSX element created:', jsxElement);
    
    console.log('Converting JSX to TXML...');
    const txml = jsxToTXML(jsxElement);
    console.log('TXML conversion completed');
    
    console.log('Generated TXML from build-time JSX:', txml);
    
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
}`;
    
    console.log('TSS Styles:', tssStyles);
    console.log('TXML and TSS prepared for rendering');
    console.log('Build-time JSX demo initialized successfully!');
    
    return { txml, tssStyles };
    
  } catch (error) {
    console.error('Failed to initialize build-time JSX demo:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}