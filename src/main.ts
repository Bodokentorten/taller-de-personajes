import { mount } from 'svelte';
import '@fontsource/eb-garamond/latin-400.css';
import '@fontsource/eb-garamond/latin-400-italic.css';
import '@fontsource/eb-garamond/latin-600.css';
import '@fontsource/unifrakturmaguntia/latin-400.css';
import './estilos/base.css';
import App from './App.svelte';

const destino = document.getElementById('app');
if (!destino) throw new Error('Falta el elemento #app');

export default mount(App, { target: destino });
