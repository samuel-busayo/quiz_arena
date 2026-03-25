import React, { useState, useEffect } from 'react'
import { TvButton } from '../../components/ui/TvButton'
import { TvCard } from '../../components/ui/TvCard'
import { TvText } from '../../components/ui/TvText'
import { TvPanel } from '../../components/ui/TvPanel'
import { ArrowLeft, Settings, Volume2, Moon, Sun, Trash2, Save, RotateCcw, CheckCircle2, Zap } from 'lucide-react'
import { useQuizStore, SystemSettings } from '../../store/useQuizStore'

export function SettingsScreen() {
    const { setUiScreen, resetQuiz, systemSettings, updateSystemSettings } = useQuizStore()

    const [localSettings, setLocalSettings] = useState<SystemSettings>(systemSettings)
    const [showSavedMsg, setShowSavedMsg] = useState(false)

    useEffect(() => {
        setLocalSettings(systemSettings)
    }, [systemSettings])

    const handleSave = () => {
        updateSystemSettings(localSettings)
        setShowSavedMsg(true)
        setTimeout(() => setShowSavedMsg(false), 3000)
    }

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all quiz data? This action cannot be undone.')) {
            resetQuiz()
            setUiScreen('COMMAND_CENTER')
        }
    }

    return (
        <div className="h-full w-full flex flex-col p-8 gap-8 max-w-4xl mx-auto overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-tv-border pb-6">
                <div className="flex items-center gap-4">
                    <TvButton
                        variant="ghost"
                        size="sm"
                        iconLeft={<ArrowLeft size={18} />}
                        onClick={() => setUiScreen('COMMAND_CENTER')}
                    />
                    <div>
                        <TvText variant="h1" className="text-2xl">SYSTEM SETTINGS</TvText>
                        <TvText variant="muted">Control Center Configuration</TvText>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {showSavedMsg && (
                        <div className="flex items-center gap-2 text-tv-success animate-fadeIn">
                            <CheckCircle2 size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Changes Saved</span>
                        </div>
                    )}
                    <TvButton
                        variant="primary"
                        size="sm"
                        iconLeft={<Save size={18} />}
                        onClick={handleSave}
                    >
                        Save Changes
                    </TvButton>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar pb-24 space-y-8">
                {/* Audio Settings */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 text-tv-accent">
                        <Volume2 size={20} />
                        <TvText variant="h3">Audio Engine</TvText>
                    </div>
                    <TvCard className="p-6 space-y-6 bg-tv-panel/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <TvText variant="body" className="font-bold">Master Volume</TvText>
                                <TvText variant="muted" className="text-xs">Adjust the overall sound intensity</TvText>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-mono text-tv-accent w-8 text-right">{localSettings.volume}%</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={localSettings.volume}
                                    onChange={(e) => setLocalSettings({ ...localSettings, volume: parseInt(e.target.value) })}
                                    className="w-48 accent-tv-accent cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <TvText variant="body" className="font-bold">Sound Effects</TvText>
                                <TvText variant="muted" className="text-xs">Enable/disable UI interaction sounds</TvText>
                            </div>
                            <button
                                onClick={() => setLocalSettings({ ...localSettings, sfxEnabled: !localSettings.sfxEnabled })}
                                className={cn(
                                    "w-12 h-6 rounded-full relative transition-colors duration-300",
                                    localSettings.sfxEnabled ? "bg-tv-accent" : "bg-tv-panel border border-tv-border"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 w-4 h-4 rounded-full transition-all duration-300",
                                    localSettings.sfxEnabled ? "right-1 bg-tv-bg" : "left-1 bg-tv-textMuted"
                                )} />
                            </button>
                        </div>
                    </TvCard>
                </section>

                {/* Appearance Settings */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 text-tv-accent">
                        <Moon size={20} />
                        <TvText variant="h3">Visual Interface</TvText>
                    </div>
                    <TvCard className="p-6 space-y-6 bg-tv-panel/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <TvText variant="body" className="font-bold">Mission Control Theme</TvText>
                                <TvText variant="muted" className="text-xs">Switch between interface aesthetics</TvText>
                            </div>
                            <div className="flex bg-tv-bg p-1 rounded-md border border-tv-border shadow-inner">
                                <button
                                    onClick={() => setLocalSettings({ ...localSettings, theme: 'dark' })}
                                    className={cn(
                                        "px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2",
                                        localSettings.theme === 'dark' ? "bg-tv-accent text-tv-bg shadow-sm" : "text-tv-textMuted hover:text-tv-textPrimary"
                                    )}
                                >
                                    <Moon size={14} />
                                    Dark
                                </button>
                                <button
                                    onClick={() => setLocalSettings({ ...localSettings, theme: 'light' })}
                                    className={cn(
                                        "px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2",
                                        localSettings.theme === 'light' ? "bg-tv-accent text-tv-bg shadow-sm" : "text-tv-textMuted hover:text-tv-textPrimary"
                                    )}
                                >
                                    <Sun size={14} />
                                    Light
                                </button>
                                <button
                                    onClick={() => setLocalSettings({ ...localSettings, theme: 'glossy' })}
                                    className={cn(
                                        "px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2",
                                        localSettings.theme === 'glossy' ? "bg-tv-accent text-tv-bg shadow-sm" : "text-tv-textMuted hover:text-tv-textPrimary"
                                    )}
                                >
                                    <Zap size={14} />
                                    Glossy
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <TvText variant="body" className="font-bold">Neural Drift (Particles)</TvText>
                                <TvText variant="muted" className="text-xs">Dynamic background animation density</TvText>
                            </div>
                            <select
                                value={localSettings.particleDensity}
                                onChange={(e) => setLocalSettings({ ...localSettings, particleDensity: e.target.value as any })}
                                className="bg-tv-bg border border-tv-border text-tv-textPrimary text-xs rounded p-2 focus:border-tv-accent outline-none cursor-pointer"
                            >
                                <option value="low">Low Density</option>
                                <option value="balanced">Balanced</option>
                                <option value="high">High Performance</option>
                            </select>
                        </div>
                    </TvCard>
                </section>

                {/* Danger Zone */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 text-tv-danger">
                        <Trash2 size={20} />
                        <TvText variant="h3">System Maintenance</TvText>
                    </div>
                    <TvCard className="p-6 border-tv-danger/30 bg-tv-danger/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <TvText variant="body" className="font-bold text-tv-danger">Factory Reset</TvText>
                                <TvText variant="muted" className="text-xs">Clear all local storage and session data</TvText>
                            </div>
                            <TvButton
                                variant="ghost"
                                className="text-tv-danger hover:bg-tv-danger/20 border-tv-danger/20"
                                iconLeft={<RotateCcw size={16} />}
                                onClick={handleReset}
                            >
                                Reset System
                            </TvButton>
                        </div>
                    </TvCard>
                </section>
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
