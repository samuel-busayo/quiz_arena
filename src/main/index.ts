import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { readdir, readFile, writeFile, rename } from 'fs/promises'

let adminWindow: BrowserWindow | null = null
let projectorWindow: BrowserWindow | null = null

function createProjectorWindow(): void {
    if (projectorWindow) {
        projectorWindow.focus()
        return
    }

    const displays = screen.getAllDisplays()
    const externalDisplay = displays.find((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0
    })

    projectorWindow = new BrowserWindow({
        ...(externalDisplay
            ? {
                x: externalDisplay.bounds.x,
                y: externalDisplay.bounds.y,
                fullscreen: true
            }
            : {
                width: 1024,
                height: 768,
                title: 'TechVerse Projector (Simulation Mode)'
            }),
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        projectorWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#projector`)
    } else {
        projectorWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'projector' })
    }

    projectorWindow.on('closed', () => {
        projectorWindow = null
    })
}

function createWindows(): void {
    // Create Admin Window
    adminWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    if (!adminWindow) return

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

    // Auto-open projector if external display found or in dev
    const displays = screen.getAllDisplays()
    const hasExternal = displays.some(d => d.bounds.x !== 0 || d.bounds.y !== 0)
    if (hasExternal || is.dev) {
        createProjectorWindow()
    }
}

app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.techverse.quizarena')

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    // IPC Handlers
    ipcMain.handle('get-version', () => app.getVersion())
    ipcMain.handle('get-collections', async () => {
        const collectionsPath = join(app.getAppPath(), 'data/collections')
        try {
            const files = await readdir(collectionsPath)
            return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
        } catch (err) {
            console.error('Failed to read collections:', err)
            return []
        }
    })

    ipcMain.handle('get-collection', async (_, name: string) => {
        const filePath = join(app.getAppPath(), 'data/collections', `${name}.json`)
        try {
            const content = await readFile(filePath, 'utf-8')
            return JSON.parse(content)
        } catch (err) {
            console.error(`Failed to read collection ${name}:`, err)
            return null
        }
    })

    ipcMain.handle('save-collection', async (_, name: string, questions: any[]) => {
        const filePath = join(app.getAppPath(), 'data/collections', `${name}.json`)
        try {
            await writeFile(filePath, JSON.stringify(questions, null, 2))
            return true
        } catch (err) {
            console.error(`Failed to save collection ${name}:`, err)
            return false
        }
    })

    ipcMain.handle('create-collection', async (_, name: string) => {
        const filePath = join(app.getAppPath(), 'data/collections', `${name}.json`)
        try {
            if (join(app.getAppPath(), 'data/collections', `${name}.json`).includes('..')) return false // Basic safety
            await writeFile(filePath, JSON.stringify([], null, 2))
            return true
        } catch (err) {
            console.error(`Failed to create collection ${name}:`, err)
            return false
        }
    })

    ipcMain.handle('delete-collection', async (_, name: string) => {
        const filePath = join(app.getAppPath(), 'data/collections', `${name}.json`)
        try {
            const { unlink } = require('fs/promises')
            await unlink(filePath)
            return true
        } catch (err) {
            console.error(`Failed to delete collection ${name}:`, err)
            return false
        }
    })

    ipcMain.handle('rename-collection', async (_, oldName: string, newName: string) => {
        const oldPath = join(app.getAppPath(), 'data/collections', `${oldName}.json`)
        const newPath = join(app.getAppPath(), 'data/collections', `${newName}.json`)
        try {
            await rename(oldPath, newPath)
            return true
        } catch (err) {
            console.error(`Failed to rename collection from ${oldName} to ${newName}:`, err)
            return false
        }
    })

    ipcMain.on('update-quiz-state', (_, state: any) => {
        if (projectorWindow) {
            projectorWindow.webContents.send('quiz-state-update', state)
        }
    })

    // Results Persistence
    const resultsPath = join(app.getAppPath(), 'data/results')
    const { mkdir } = require('fs/promises')
    mkdir(resultsPath, { recursive: true }).catch(console.error)

    ipcMain.handle('save-quiz-result', async (_, result: any) => {
        const filePath = join(resultsPath, `result_${result.id || Date.now()}.json`)
        try {
            await writeFile(filePath, JSON.stringify(result, null, 2))
            return true
        } catch (err) {
            console.error('Failed to save result:', err)
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
            console.error('Failed to get results:', err)
            return []
        }
    })

    ipcMain.on('ping', () => console.log('pong'))
    ipcMain.on('open-projector', () => createProjectorWindow())

    createWindows()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindows()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
