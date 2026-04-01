import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { displayManager } from './DisplayManager'

export class ProjectionWindowManager {
    private window: BrowserWindow | null = null

    constructor() { }

    createWindow() {
        console.log('[PROJECTION] Creating window...')
        if (this.window) {
            console.log('[PROJECTION] Window already exists, focusing.')
            this.window.focus()
            return
        }

        const secondary = displayManager.getSecondaryDisplay()
        const bounds = secondary ? secondary.bounds : { x: 0, y: 0, width: 1024, height: 768 }
        console.log('[PROJECTION] Using display bounds:', bounds, 'Secondary exists:', !!secondary)

        this.window = new BrowserWindow({
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            fullscreen: !!secondary,
            frame: false,
            resizable: false,
            movable: false,
            alwaysOnTop: !!secondary,
            backgroundColor: '#050505',
            autoHideMenuBar: true,
            webPreferences: {
                preload: join(__dirname, '../preload/index.js'),
                sandbox: false,
                contextIsolation: true,
                spellcheck: false
            }
        })

        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            this.window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#projector`)
        } else {
            this.window.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'projector' })
        }

        this.window.on('closed', () => {
            this.window = null
        })

        // Prevent accidental closure if it's the projection window
        this.window.on('close', (e) => {
            if (displayManager.hasSecondaryDisplay()) {
                // e.preventDefault() // Optional: Enable to lock window
            }
        })
    }

    destroyWindow() {
        if (this.window) {
            this.window.close()
            this.window = null
        }
    }

    sendState(state: any) {
        if (this.window) {
            this.window.webContents.send('quiz-state-update', state)
        }
    }

    isAlive() {
        return this.window !== null
    }

    handleDisplayChange() {
        if (displayManager.hasSecondaryDisplay()) {
            if (!this.window) {
                this.createWindow()
            } else {
                // Update position if it moved
                const secondary = displayManager.getSecondaryDisplay()
                if (secondary) {
                    this.window.setBounds(secondary.bounds)
                    this.window.setFullScreen(true)
                }
            }
        } else {
            // If no secondary display, we keep it closed to prevent overlapping the primary screen.
            this.destroyWindow()
        }
    }
}

export const projectionWindowManager = new ProjectionWindowManager()
