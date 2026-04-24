import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Something went wrong</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            {this.state.error.message || 'An unexpected error occurred.'}
          </p>
          <button onClick={() => window.location.href = '/'}>Go to Dashboard</button>
          <button onClick={() => window.location.reload()} style={{ marginLeft: '0.5rem' }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
