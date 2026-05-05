import { Component, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; noWebGL: boolean }

export class WebGLErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, noWebGL: false };

  static getDerivedStateFromError(error: Error): State {
    const noWebGL = error.message?.toLowerCase().includes('webgl') ||
                    error.message?.toLowerCase().includes('context');
    return { hasError: true, noWebGL };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100vw', height: '100vh',
          background: '#010801',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Courier New', monospace",
          color: '#00ff44',
          gap: 16,
        }}>
          <div style={{ fontSize: 22, letterSpacing: 6, textShadow: '0 0 20px #00ff44' }}>VAULT 63</div>
          <div style={{ fontSize: 11, color: '#ff4444', letterSpacing: 2 }}>
            {this.state.noWebGL ? 'WEBGL NOT AVAILABLE IN THIS ENVIRONMENT' : 'RENDER ERROR'}
          </div>
          <div style={{ fontSize: 10, color: '#006611', letterSpacing: 1, textAlign: 'center', maxWidth: 400 }}>
            {this.state.noWebGL
              ? 'WebGL is required for the 3D vault experience.\nPlease open the preview in a full browser tab.'
              : 'An unexpected error occurred. Please reload.'}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: '8px 24px',
              background: 'transparent',
              border: '1px solid #00aa33',
              color: '#00ff44',
              fontFamily: 'inherit',
              fontSize: 11,
              letterSpacing: 2,
              cursor: 'pointer',
            }}
          >
            RELOAD VAULT
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function checkWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!ctx;
  } catch {
    return false;
  }
}
