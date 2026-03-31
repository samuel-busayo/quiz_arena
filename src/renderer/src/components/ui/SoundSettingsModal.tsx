import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuizStore } from '../../store/useQuizStore'
import { TvText } from './TvText'
import { TvButton } from './TvButton'
import { Volume2, VolumeX, Music, X } from 'lucide-react'

export function SoundSettingsModal({
    isOpen,
    onClose
}: {
    isOpen: boolean
    onClose: () => void
}) {
    const { systemSettings, updateSystemSettings } = useQuizStore()

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateSystemSettings({ volume: parseInt(e.target.value) })
    }

    const toggleBgm = () => {
        updateSystemSettings({ bgmEnabled: !systemSettings.bgmEnabled })
    }

    const toggleSfx = () => {
        updateSystemSettings({ sfxEnabled: !systemSettings.sfxEnabled })
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    {/* Click away to close */}
                    <div className="absolute inset-0" onClick={onClose} />

                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="relative w-full max-w-sm bg-tv-panel border border-tv-border rounded-xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col gap-6"
                    >
                        <div className="flex justify-between items-center">
                            <TvText variant="h2" className="text-xl tracking-widest uppercase">
                                Audio Systems
                            </TvText>
                            <TvButton variant="ghost" size="sm" onClick={onClose}>
                                <X size={20} />
                            </TvButton>
                        </div>

                        <div className="space-y-6">
                            {/* Master Volume */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <TvText variant="label" className="text-xs tracking-widest uppercase text-tv-textMuted">
                                        Master Volume
                                    </TvText>
                                    <TvText variant="label" className="text-xs text-tv-accent">
                                        {systemSettings.volume}%
                                    </TvText>
                                </div>
                                <div className="flex items-center gap-4">
                                    <VolumeX size={18} className="text-tv-textMuted" />
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={systemSettings.volume}
                                        onChange={handleVolumeChange}
                                        className="w-full h-2 bg-tv-border rounded-lg appearance-none cursor-pointer accent-tv-accent"
                                    />
                                    <Volume2 size={18} className="text-tv-textMuted" />
                                </div>
                            </div>

                            <div className="h-[1px] w-full bg-tv-border/50" />

                            {/* Toggles */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Music size={18} className={systemSettings.bgmEnabled ? 'text-tv-accent' : 'text-tv-textMuted'} />
                                        <TvText variant="label" className="text-sm tracking-widest uppercase">
                                            Background Music
                                        </TvText>
                                    </div>
                                    <button
                                        onClick={toggleBgm}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${systemSettings.bgmEnabled ? 'bg-tv-accent' : 'bg-tv-border'}`}
                                    >
                                        <motion.div
                                            animate={{ x: systemSettings.bgmEnabled ? 24 : 2 }}
                                            className="w-5 h-5 bg-white rounded-full absolute top-[2px]"
                                        />
                                    </button>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Volume2 size={18} className={systemSettings.sfxEnabled ? 'text-tv-accent' : 'text-tv-textMuted'} />
                                        <TvText variant="label" className="text-sm tracking-widest uppercase">
                                            Sound Effects
                                        </TvText>
                                    </div>
                                    <button
                                        onClick={toggleSfx}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${systemSettings.sfxEnabled ? 'bg-tv-accent' : 'bg-tv-border'}`}
                                    >
                                        <motion.div
                                            animate={{ x: systemSettings.sfxEnabled ? 24 : 2 }}
                                            className="w-5 h-5 bg-white rounded-full absolute top-[2px]"
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
