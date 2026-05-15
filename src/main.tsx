import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChatInterface } from './ui/ChatInterface';

const App = () => (
  <div>
    <h1>DarkShark Interface</h1>
    <ChatInterface />
  </div>
);

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
