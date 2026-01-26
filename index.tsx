import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import UiContextProvider from './customContexts/UiContext';
import AuthContextProvider from './customContexts/AuthContext';
import LiveContextProvider from './customContexts/LiveContext';
import './index.css'


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// layout for making contexts available globally 
const ContextsLayout = ({ children }: { children?: React.ReactNode }) => (
     <UiContextProvider>
        <AuthContextProvider>
          <LiveContextProvider>
            {children}
          </LiveContextProvider>
        </AuthContextProvider>
     </UiContextProvider>
);
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ContextsLayout>
      <App />
    </ContextsLayout> 
  </React.StrictMode>
);