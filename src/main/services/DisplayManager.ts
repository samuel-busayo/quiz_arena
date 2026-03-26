import { screen, Display } from 'electron'
import { EventEmitter } from 'events'

export class DisplayManager extends EventEmitter {
    private primaryDisplay: Display | null = null
    private secondaryDisplay: Display | null = null
    private initialized = false

    constructor() {
        super()
    }

    initialize() {
        if (this.initialized) return

        this.updateDisplays()

        screen.on('display-added', () => this.handleDisplayChange())
        screen.on('display-removed', () => this.handleDisplayChange())
        screen.on('display-metrics-changed', () => this.handleDisplayChange())

        this.initialized = true
    }

    private updateDisplays() {
        const displays = screen.getAllDisplays()
        console.log('[DISPLAY] Detected displays count:', displays.length)
        this.primaryDisplay = screen.getPrimaryDisplay()
        this.secondaryDisplay = displays.find(d => d.id !== this.primaryDisplay?.id) || null
        console.log('[DISPLAY] Primary ID:', this.primaryDisplay?.id, 'Secondary ID:', this.secondaryDisplay?.id)
    }

    private handleDisplayChange() {
        const oldSecondaryId = this.secondaryDisplay?.id
        this.updateDisplays()

        if (this.secondaryDisplay && this.secondaryDisplay.id !== oldSecondaryId) {
            this.emit('secondary-display-added', this.secondaryDisplay)
        } else if (!this.secondaryDisplay && oldSecondaryId) {
            this.emit('secondary-display-removed')
        } else {
            this.emit('display-metrics-changed', this.secondaryDisplay)
        }
    }

    getPrimaryDisplay() {
        return this.primaryDisplay
    }

    getSecondaryDisplay() {
        return this.secondaryDisplay
    }

    hasSecondaryDisplay() {
        return this.secondaryDisplay !== null
    }
}

export const displayManager = new DisplayManager()
