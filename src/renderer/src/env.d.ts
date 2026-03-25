/// <reference types="vite/client" />
/// <reference types="electron-vite/node" />

interface Api {
    getVersion: () => Promise<string>
    getCollections: () => Promise<string[]>
    getCollection: (name: string) => Promise<any>
    saveCollection: (name: string, questions: any[]) => Promise<boolean>
    createCollection: (name: string) => Promise<boolean>
    deleteCollection: (name: string) => Promise<boolean>
    renameCollection: (oldName: string, newName: string) => Promise<boolean>
    updateQuizState: (state: any) => void
    onQuizStateUpdate: (callback: (state: any) => void) => () => void
    saveQuizResult: (result: any) => Promise<boolean>
    getQuizResults: () => Promise<any[]>
    openProjector: () => void
    getDisplayInfo: () => Promise<{
        count: number
        primaryRes: string
        secondaryRes: string
        isProjectorAlive: boolean
    }>
}

interface Window {
    electron: import('@electron-toolkit/preload').ElectronAPI
    api: Api
}
