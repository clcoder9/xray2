import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import './styles.css';

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

render(<App />, document.getElementById('app')!);
