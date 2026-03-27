import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Local Font Bundling (Offline Stability)
import '@fontsource/inter/400.css'
import '@fontsource/inter/700.css'
import '@fontsource/orbitron/400.css'
import '@fontsource/orbitron/700.css'
import '@fontsource/orbitron/900.css'
import '@fontsource/rajdhani/400.css'
import '@fontsource/rajdhani/500.css'
import '@fontsource/rajdhani/700.css'

import './index.css'

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error?: Error }> {
    constructor(props: { children: React.ReactNode }) {
        super(props)
        this.state = { hasError: false }
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ color: 'red', padding: '20px', background: 'white', height: '100vh', width: '100vw', zIndex: 99999, overflow: 'auto' }}>
                    <h1>UI Rendering Crash</h1>
                    <pre>{this.state.error?.stack || this.state.error?.message}</pre>
                </div>
            )
        }
        return this.props.children
    }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
)
