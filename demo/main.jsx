import { TXMLTSSRenderer, DefaultConsoleLogger, jsx, jsxs, Fragment, jsxToTXML } from '../dist/index.js';

// JSX Demo Component
function JSXDemo() {
  const [count, setCount] = React.useState(0);
  const [name, setName] = React.useState('');
  const [volume, setVolume] = React.useState(0.5);
  const [enabled, setEnabled] = React.useState(false);

  return (
    <App>
      <Body>
        <Window title="Build-time JSX Demo">
          <Text>Welcome to Build-time JSX ImGui!</Text>
          <Text>Count: {count}</Text>
          <Button onClick={() => setCount(count + 1)}>
            Clicked {count} times
          </Button>
          <SameLine />
          <Button id="greenButton" onClick={() => console.log('Green button clicked!')}>
            Green Button
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

// Export for build system
export default JSXDemo;
