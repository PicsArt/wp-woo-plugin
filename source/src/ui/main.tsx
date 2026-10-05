import {createRoot} from 'react-dom/client';
import App from './App';
import ConsentGate from './ConsentGate';
import './styles.css';
createRoot(document.getElementById('picsart-studio')!).render(<ConsentGate><App/></ConsentGate>);
