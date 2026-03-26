import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { readdir, readFile, writeFile, rename } from 'fs/promises'
import { displayManager } from './services/DisplayManager'
import { projectionWindowManager } from './services/ProjectionWindowManager'

let adminWindow: BrowserWindow | null = null

// Optimize for high-visual projection (fix tile memory warnings)
app.commandLine.appendSwitch('force-gpu-mem-available-mb', '2048')
app.commandLine.appendSwitch('num-raster-threads', '4')
app.commandLine.appendSwitch('ignore-gpu-blacklist')

function createAdminWindow(): void {
    adminWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            spellcheck: false
        }
    })

    adminWindow.on('ready-to-show', () => {
        adminWindow?.show()
    })

    adminWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        adminWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#admin`)
    } else {
        adminWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'admin' })
    }
}

app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.techverse.quizarena')

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    // Initialize Services
    displayManager.initialize()

    displayManager.on('secondary-display-added', () => {
        projectionWindowManager.createWindow()
    })
    displayManager.on('secondary-display-removed', () => {
        projectionWindowManager.destroyWindow()
    })
    displayManager.on('display-metrics-changed', () => {
        projectionWindowManager.handleDisplayChange()
    })

    // IPC Handlers
    ipcMain.handle('get-version', () => app.getVersion())
    ipcMain.handle('get-display-info', () => {
        const displays = screen.getAllDisplays()
        const primary = screen.getPrimaryDisplay()
        const secondary = displays.find(d => d.id !== primary.id)
        return {
            count: displays.length,
            primaryRes: `${primary.bounds.width}x${primary.bounds.height}`,
            secondaryRes: secondary ? `${secondary.bounds.width}x${secondary.bounds.height}` : 'N/A',
            isProjectorAlive: projectionWindowManager.isAlive()
        }
    })

    // Collections
    const collectionsPath = join(app.getAppPath(), 'data/collections')
    ipcMain.handle('get-collections', async () => {
        try {
            const files = await readdir(collectionsPath)
            return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
        } catch (err) {
            return []
        }
    })

    ipcMain.handle('get-collection', async (_, name) => {
        try {
            const content = await readFile(join(collectionsPath, `${name}.json`), 'utf-8')
            return JSON.parse(content)
        } catch (err) {
            return null
        }
    })

    ipcMain.handle('save-collection', async (_, name, questions) => {
        try {
            await writeFile(join(collectionsPath, `${name}.json`), JSON.stringify(questions, null, 2))
            return true
        } catch (err) {
            return false
        }
    })

    ipcMain.handle('create-collection', async (_, name) => {
        try {
            await writeFile(join(collectionsPath, `${name}.json`), JSON.stringify([], null, 2))
            return true
        } catch (err) {
            return false
        }
    })

    ipcMain.handle('delete-collection', async (_, name) => {
        try {
            const { unlink } = require('fs/promises')
            await unlink(join(collectionsPath, `${name}.json`))
            return true
        } catch (err) {
            return false
        }
    })

    ipcMain.handle('rename-collection', async (_, oldName, newName) => {
        try {
            await rename(join(collectionsPath, `${oldName}.json`), join(collectionsPath, `${newName}.json`))
            return true
        } catch (err) {
            return false
        }
    })

    // Results
    const resultsPath = join(app.getAppPath(), 'data/results')
    require('fs/promises').mkdir(resultsPath, { recursive: true }).catch(console.error)

    ipcMain.handle('save-quiz-result', async (_, result) => {
        try {
            await writeFile(join(resultsPath, `result_${result.id || Date.now()}.json`), JSON.stringify(result, null, 2))
            return true
        } catch (err) {
            return false
        }
    })

    ipcMain.handle('get-quiz-results', async () => {
        try {
            const files = await readdir(resultsPath)
            const results = await Promise.all(
                files.filter(f => f.endsWith('.json')).map(async (file) => {
                    const content = await readFile(join(resultsPath, file), 'utf-8')
                    return JSON.parse(content)
                })
            )
            return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        } catch (err) {
            return []
        }
    })

    // Simulation Sync
    ipcMain.on('update-quiz-state', (_, state) => {
        projectionWindowManager.sendState(state)
    })

    // Offline Session Persistence
    const sessionsPath = join(app.getPath('documents'), 'TechVerseQuizArena', 'sessions')
    require('fs/promises').mkdir(sessionsPath, { recursive: true }).catch(console.error)

    ipcMain.handle('save-session', async (_, session) => {
        try {
            const fileName = `active_session.json`
            const tempPath = join(sessionsPath, `${fileName}.tmp`)
            const finalPath = join(sessionsPath, fileName)

            await writeFile(tempPath, JSON.stringify(session, null, 2))
            await rename(tempPath, finalPath)
            return true
        } catch (err) {
            console.error('Save Session Error:', err)
            return false
        }
    })

    ipcMain.handle('get-sessions', async () => {
        try {
            const fileName = `active_session.json`
            const exists = await require('fs/promises').access(join(sessionsPath, fileName)).then(() => true).catch(() => false)
            if (!exists) return []

            const content = await readFile(join(sessionsPath, fileName), 'utf-8')
            return [JSON.parse(content)]
        } catch (err) {
            return []
        }
    })

    ipcMain.handle('load-session', async () => {
        try {
            const content = await readFile(join(sessionsPath, `active_session.json`), 'utf-8')
            return JSON.parse(content)
        } catch (err) {
            return null
        }
    })

    ipcMain.handle('delete-session', async () => {
        try {
            const { unlink } = require('fs/promises')
            await unlink(join(sessionsPath, `active_session.json`))
            return true
        } catch (err) {
            return false
        }
    })

    ipcMain.on('open-projector', () => {
        projectionWindowManager.createWindow()
    })

    // Boot
    createAdminWindow()

    // Auto-open projector if secondary exists or in dev
    if (displayManager.hasSecondaryDisplay() || is.dev) {
        projectionWindowManager.createWindow()
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createAdminWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
