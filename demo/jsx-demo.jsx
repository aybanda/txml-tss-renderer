import { createRoot, useState, jsx, jsxs, Fragment } from '../dist/index.js';
 
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