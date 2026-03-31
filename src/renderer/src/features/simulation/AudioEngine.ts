import { Howl } from 'howler'

// Import audio assets as Vite modules for proper URL resolution
import mainBgmUrl from '../../assets/audio/main_background_music.mp3'
import theWaitUrl from '../../assets/audio/the_wait.mp3'
import winUrl from '../../assets/audio/win.mp3'

// New SFX & BGM for live quiz
import questionWhooshUrl from '../../assets/audio/question_whoosh_sfx.mp3'
import questionSelectUrl from '../../assets/audio/question_select_sfx.mp3'
import countdown16sUrl from '../../assets/audio/countdown_sfx_16sec.mp3'
import heartbeatUrl from '../../assets/audio/heartbeat_sfx.mp3'
import buzzerUrl from '../../assets/audio/buzzer_sfx.mp3'
import correctAnswerUrl from '../../assets/audio/correct_answer_sfx.mp3'
import liveQuizBgmUrl from '../../assets/audio/intro-futuristic.mp3'

class AudioEngine {
    private sounds: Record<string, Howl> = {}
    private currentBgm: Howl | null = null
    private currentBgmName: string | null = null
    private _masterVolume: number = 50
    private _sfxVolume: number = 100
    private _sfxEnabled: boolean = true

    constructor() {
        // Load new SFX
        this.load('questionWhoosh', questionWhooshUrl)
        this.load('questionSelect', questionSelectUrl)
        this.load('countdown16s', countdown16sUrl)
        this.load('heartbeat', heartbeatUrl)
        this.load('buzzer', buzzerUrl)
        this.load('correctAnswer', correctAnswerUrl)
        // BGM tracks use WebAudio (html5: false) — bypass Electron autoplay restrictions
        this.loadBgm('mainBgm', mainBgmUrl)
        this.loadBgm('theWait', theWaitUrl)
        this.loadBgm('liveQuizBgm', liveQuizBgmUrl)
        // Win cinematic — two looping segments via Howler sprites
        // Sprite format: [offset_ms, duration_ms, loop]
        this.sounds['winBgm'] = new Howl({
            src: [winUrl],
            html5: false,
            sprite: {
                intro: [0, 30000, true],   // Stages 1–3: loop 0:00–0:30
                climax: [29000, 90000, true]    // Stages 4–5: loop 0:29→end (large dur clips to track end)
            },
            volume: this._masterVolume / 100,
            onloaderror: (_id: any, err: any) => console.error('[AudioEngine] win load error:', err),
            onplayerror: (_id: any, err: any) => console.error('[AudioEngine] win play error:', err)
        })
    }

    private load(name: string, path: string) {
        this.sounds[name] = new Howl({
            src: [path],
            html5: true,   // HTML5 for SFX — lower memory for short clips
            volume: this._masterVolume / 100
        })
    }

    private loadBgm(name: string, path: string) {
        this.sounds[name] = new Howl({
            src: [path],
            html5: false,  // WebAudio for BGM — bypasses Electron autoplay restrictions
            volume: this._masterVolume / 100,
            onloaderror: (_id: any, err: any) => console.error(`[AudioEngine] Failed to load BGM "${name}":`, err),
            onplayerror: (_id: any, err: any) => console.error(`[AudioEngine] Failed to play BGM "${name}":`, err)
        })
    }

    // --- Settings-aware controls ---

    set sfxEnabled(val: boolean) {
        this._sfxEnabled = val
    }

    setMasterVolume(volume: number) {
        this._masterVolume = volume
        if (this.currentBgm && this.currentBgm.playing()) {
            const targetVol = this.currentBgmName === 'liveQuizBgm' ? (volume / 100) * 0.4 : volume / 100
            this.currentBgm.volume(targetVol)
        }
    }

    setSfxVolume(volume: number) {
        this._sfxVolume = volume
        const timerSound = this.sounds['countdown16s']
        if (timerSound && timerSound.playing()) {
            timerSound.volume((this._masterVolume / 100) * (this._sfxVolume / 100))
        }
    }

    playSfx(name: string) {
        if (!this._sfxEnabled) return
        if (this.sounds[name]) {
            this.sounds[name].volume((this._masterVolume / 100) * (this._sfxVolume / 100))
            this.sounds[name].play()
        }
    }

    stopSfx(name: string) {
        if (this.sounds[name] && this.sounds[name].playing()) {
            this.sounds[name].stop()
        }
    }

    // --- Continuous Timer Loop Logic ---
    // Start the timer loop. It will loop indefinitely until stopped.
    playTimerLoop() {
        if (!this._sfxEnabled) return
        const sound = this.sounds['countdown16s']
        if (!sound) return

        // If already playing, let it continue uninterrupted
        if (sound.playing()) return

        sound.loop(true)
        sound.volume((this._masterVolume / 100) * (this._sfxVolume / 100))
        sound.play()
    }

    // --- Unified BGM control ---
    // Single entry point for all BGM transitions. Handles:
    //   - Same track already playing → no-op (volume update only)
    //   - Same track paused → resume with fade-in
    //   - Different track → crossfade old out, new in
    //   - null → fade out and PAUSE current (keeps it ready for quick resume)

    switchBgm(name: string | null, loop: boolean = true) {
        // Request silence — PAUSE (not stop) so track resumes instantly next time
        if (!name) {
            if (this.currentBgm && this.currentBgm.playing()) {
                const oldBgm = this.currentBgm
                oldBgm.fade(oldBgm.volume(), 0, 800)
                setTimeout(() => {
                    if (oldBgm.playing()) oldBgm.pause()
                }, 850)
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
                // Was paused — resume with fade-in
                nextBgm.play()
                nextBgm.fade(nextBgm.volume(), this._masterVolume / 100, 800)
            }
            return
        }

        // Different track — fade out old (pause it, keep position), start new
        if (this.currentBgm) {
            const oldBgm = this.currentBgm
            oldBgm.fade(oldBgm.volume(), 0, 500)
            setTimeout(() => {
                if (oldBgm.playing()) oldBgm.pause()
            }, 550)
        }

        this.currentBgm = nextBgm
        this.currentBgmName = name
        nextBgm.loop(loop)

        if (nextBgm.playing()) {
            // Already playing (e.g. looping) — just fade up
            const targetVol = name === 'liveQuizBgm' ? (this._masterVolume / 100) * 0.4 : this._masterVolume / 100
            nextBgm.fade(nextBgm.volume(), targetVol, 800)
        } else {
            // Start or resume from where it was paused
            nextBgm.volume(0)
            nextBgm.play()
            const targetVol = name === 'liveQuizBgm' ? (this._masterVolume / 100) * 0.4 : this._masterVolume / 100
            nextBgm.fade(0, targetVol, 1000)
        }
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

    // --- Win Cinematic Sprite Methods ---

    playWinIntro() {
        // Stop any currently playing BGM first
        this.switchBgm(null)
        const win = this.sounds['winBgm']
        if (!win) return
        if (win.playing()) win.stop()
        win.volume(this._masterVolume / 100)
        win.play('intro') // Loops 0:00–0:30
    }

    playWinClimax() {
        const win = this.sounds['winBgm']
        if (!win) return
        if (win.playing()) {
            // Already on intro — crossfade into climax
            win.fade(win.volume(), 0, 400)
            setTimeout(() => {
                win.stop()
                win.volume(this._masterVolume / 100)
                win.play('climax') // Loops 0:29–end
            }, 450)
        } else {
            win.volume(this._masterVolume / 100)
            win.play('climax')
        }
    }

    stopWinBgm() {
        const win = this.sounds['winBgm']
        if (win && win.playing()) {
            win.fade(win.volume(), 0, 600)
            setTimeout(() => win.stop(), 650)
        }
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
