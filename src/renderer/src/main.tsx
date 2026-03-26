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

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
