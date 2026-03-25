import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
    getVersion: () => ipcRenderer.invoke('get-version'),
    getCollections: () => ipcRenderer.invoke('get-collections'),
    getCollection: (name: string) => ipcRenderer.invoke('get-collection', name),
    saveCollection: (name: string, questions: any[]) => ipcRenderer.invoke('save-collection', name, questions),
    createCollection: (name: string) => ipcRenderer.invoke('create-collection', name),
    deleteCollection: (name: string) => ipcRenderer.invoke('delete-collection', name),
    renameCollection: (oldName: string, newName: string) => ipcRenderer.invoke('rename-collection', oldName, newName),
    updateQuizState: (state: any) => ipcRenderer.send('update-quiz-state', state),
    onQuizStateUpdate: (callback: (state: any) => void) => {
        const listener = (_event: any, state: any) => callback(state)
        ipcRenderer.on('quiz-state-update', listener)
        return () => ipcRenderer.removeListener('quiz-state-update', listener)
    }
}

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI
    // @ts-ignore (define in dts)
    window.api = api
}
