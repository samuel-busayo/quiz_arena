import { Howl } from 'howler'

class AudioEngine {
    private sounds: Record<string, Howl> = {}
    private currentBgm: Howl | null = null

    constructor() {
        // Preload sounds
        this.load('countdown', 'src/renderer/src/assets/audio/countdown.mp3')
        this.load('correct', 'src/renderer/src/assets/audio/correct.mp3')
        this.load('wrong', 'src/renderer/src/assets/audio/wrong.mp3')
        this.load('leaderboard', 'src/renderer/src/assets/audio/leaderboard.mp3')
        this.load('elimination', 'src/renderer/src/assets/audio/elimination.mp3')
        this.load('winner', 'src/renderer/src/assets/audio/winner.mp3')
    }

    private load(name: string, path: string) {
        this.sounds[name] = new Howl({
            src: [path],
            html5: true, // Use HTML5 Audio for long files to save memory
            volume: 0.5
        })
    }

    playSfx(name: string) {
        if (this.sounds[name]) {
            this.sounds[name].play()
        }
    }

    playBgm(name: string, loop: boolean = true) {
        if (this.currentBgm) {
            ; (this.currentBgm as any).fade(this.currentBgm.volume(), 0, 500)
            const oldBgm = this.currentBgm
            setTimeout(() => oldBgm.stop(), 550)
        }

        if (this.sounds[name]) {
            this.currentBgm = this.sounds[name]
                ; (this.currentBgm as any).loop(loop)
            this.currentBgm.volume(0)
            this.currentBgm.play()
                ; (this.currentBgm as any).fade(0, 0.4, 1000)
        }
    }

    stopBgm() {
        if (this.currentBgm) {
            ; (this.currentBgm as any).fade(this.currentBgm.volume(), 0, 1000)
            const oldBgm = this.currentBgm
            setTimeout(() => oldBgm.stop(), 1100)
            this.currentBgm = null
        }
    }

    setVolume(volume: number) {
        Object.values(this.sounds).forEach(s => s.volume(volume / 100))
    }
}

export const audioEngine = new AudioEngine()
