import { Howl } from 'howler'
import { useCallback, useRef } from 'react'

export type SoundType = 'TICK' | 'CORRECT' | 'WRONG' | 'TRANSITION' | 'START'

export function useAudio() {
    const sounds = useRef<{ [key in SoundType]?: Howl }>({})

    const playSound = useCallback((type: SoundType) => {
        if (!sounds.current[type]) {
            // Placeholder paths - these should be replaced with actual assets
            const paths: { [key in SoundType]: string } = {
                TICK: '/audio/tick.mp3',
                CORRECT: '/audio/correct.mp3',
                WRONG: '/audio/wrong.mp3',
                TRANSITION: '/audio/transition.mp3',
                START: '/audio/start.mp3'
            }

            sounds.current[type] = new Howl({
                src: [paths[type]],
                volume: 0.5
            })
        }

        sounds.current[type]?.play()
    }, [])

    return { playSound }
}
