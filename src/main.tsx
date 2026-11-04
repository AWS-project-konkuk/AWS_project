import React from 'react';
import ReactDOM from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import './styles.css';
import { LearningApp } from './learning/LearningApp';
import { ErrorBoundary } from './ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LearningApp />
    </ErrorBoundary>
  </React.StrictMode>,
);
