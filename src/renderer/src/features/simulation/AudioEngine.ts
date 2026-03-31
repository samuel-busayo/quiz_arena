import { Howl } from 'howler'

// Import audio assets as Vite modules for proper URL resolution
import mainBgmUrl from '../../assets/audio/main_background_music.mp3'
import theWaitUrl from '../../assets/audio/the_wait.mp3'

class AudioEngine {
    private sounds: Record<string, Howl> = {}
    private currentBgm: Howl | null = null
    private currentBgmName: string | null = null
    private _masterVolume: number = 50
    private _sfxEnabled: boolean = true

    constructor() {
        // Preload sounds (placeholder paths for SFX - these files may not exist yet)
        this.load('standbyAmbient', 'src/renderer/src/assets/audio/standbyAmbient.mp3')
        this.load('bassHit', 'src/renderer/src/assets/audio/bassHit.mp3')
        this.load('countdown', 'src/renderer/src/assets/audio/countdown.mp3')
        this.load('correct', 'src/renderer/src/assets/audio/correct.mp3')
        this.load('wrong', 'src/renderer/src/assets/audio/wrong.mp3')
        this.load('leaderboard', 'src/renderer/src/assets/audio/leaderboard.mp3')
        this.load('elimination', 'src/renderer/src/assets/audio/elimination.mp3')
        this.load('winner', 'src/renderer/src/assets/audio/winner.mp3')
        // BGM tracks use Vite-resolved URLs
        this.load('mainBgm', mainBgmUrl)
        this.load('theWait', theWaitUrl)
    }

    private load(name: string, path: string) {
        this.sounds[name] = new Howl({
            src: [path],
            html5: true,
            volume: this._masterVolume / 100
        })
    }

    // --- Settings-aware controls ---

    set sfxEnabled(val: boolean) {
        this._sfxEnabled = val
    }

    setMasterVolume(volume: number) {
        this._masterVolume = volume
        if (this.currentBgm && this.currentBgm.playing()) {
            this.currentBgm.volume(volume / 100)
        }
    }

    playSfx(name: string) {
        if (!this._sfxEnabled) return
        if (this.sounds[name]) {
            this.sounds[name].volume(this._masterVolume / 100)
            this.sounds[name].play()
        }
    }

    // --- Unified BGM control ---
    // Single entry point for all BGM transitions. Handles:
    //   - Same track already playing → no-op (volume update only)
    //   - Different track → crossfade old out, new in
    //   - null → fade out and stop current

    switchBgm(name: string | null, loop: boolean = true) {
        // Request silence
        if (!name) {
            if (this.currentBgm) {
                this.currentBgm.fade(this.currentBgm.volume(), 0, 800)
                const oldBgm = this.currentBgm
                setTimeout(() => oldBgm.stop(), 850)
                this.currentBgm = null
                this.currentBgmName = null
            }
            return
        }

        const nextBgm = this.sounds[name]
        if (!nextBgm) return

        // Same track already playing — just ensure correct volume
        if (this.currentBgmName === name && this.currentBgm === nextBgm) {
            if (nextBgm.playing()) {
                nextBgm.volume(this._masterVolume / 100)
            } else {
                // Was paused (e.g. by a previous transition) — resume
                nextBgm.volume(this._masterVolume / 100)
                nextBgm.play()
            }
            return
        }

        // Different track — fade out old, start new
        if (this.currentBgm) {
            this.currentBgm.fade(this.currentBgm.volume(), 0, 500)
            const oldBgm = this.currentBgm
            setTimeout(() => oldBgm.stop(), 550)
        }

        this.currentBgm = nextBgm
        this.currentBgmName = name
        nextBgm.loop(loop)
        nextBgm.volume(0)
        nextBgm.play()
        nextBgm.fade(0, this._masterVolume / 100, 1000)
    }

    // --- Convenience aliases ---

    playBgm(name: string, loop: boolean = true) {
        this.switchBgm(name, loop)
    }

    stopBgm() {
        this.switchBgm(null)
    }

    playMainBgm() {
        this.switchBgm('mainBgm', true)
    }

    pauseMainBgm() {
        // Only relevant if mainBgm IS the current track
        if (this.currentBgmName === 'mainBgm' && this.currentBgm && this.currentBgm.playing()) {
            this.currentBgm.fade(this.currentBgm.volume(), 0, 500)
            const bgm = this.currentBgm
            setTimeout(() => bgm.pause(), 550)
        }
    }
}

export const audioEngine = new AudioEngine()
