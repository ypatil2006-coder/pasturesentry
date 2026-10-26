import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { RanchProvider } from './context/RanchContext';
import './index.css';

// Global error catcher for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    console.error('GLOBAL WINDOW ERROR:', e.message, e.filename, e.lineno, e.error);
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.error('UNHANDLED PROMISE REJECTION:', e.reason);
  });
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4EEDD] p-6 flex items-center justify-center font-mono">
          <div className="max-w-2xl w-full bg-white border-4 border-black p-6 rounded-2xl shadow-comic">
            <div className="bg-[#FF3B30] text-white p-3 rounded-xl border-2 border-black font-black text-sm mb-4">
              💥 RUNTIME ERROR CAUGHT IN REACT TREE
            </div>
            <pre className="bg-black text-[#FFE600] p-4 rounded-xl text-xs overflow-x-auto mb-4">
              {this.state.error?.toString()}
            </pre>
            <pre className="bg-neutral-100 p-4 rounded-xl text-[11px] overflow-x-auto text-neutral-800 mb-4 max-h-60">
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#FFE600] hover:bg-[#FFD000] text-black px-6 py-2.5 rounded-xl border-2 border-black font-bold text-xs shadow-comic-sm"
            >
              🔄 RELOAD WORKSTATION
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RanchProvider>
        <App />
      </RanchProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
