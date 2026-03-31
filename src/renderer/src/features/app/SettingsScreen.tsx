import React from 'react'
import { TvButton } from '../../components/ui/TvButton'
import { TvCard } from '../../components/ui/TvCard'
import { TvText } from '../../components/ui/TvText'
import { ArrowLeft, Volume2, Moon, Sun, Trash2, RotateCcw, Zap, Briefcase } from 'lucide-react'
import { useQuizStore } from '../../store/useQuizStore'

export function SettingsScreen() {
    const { setUiScreen, resetQuiz, systemSettings, updateSystemSettings } = useQuizStore()

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
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar pb-24 space-y-8">
                {/* Branding Settings */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 text-tv-accent">
                        <Briefcase size={20} />
                        <TvText variant="h3">Organization & Branding</TvText>
                    </div>
                    <TvCard className="p-6 space-y-6 bg-tv-panel/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <TvText variant="body" className="font-bold">Organization Name</TvText>
                                <TvText variant="muted" className="text-xs">Customize the primary application title</TvText>
                            </div>
                            <input
                                type="text"
                                maxLength={30}
                                value={systemSettings?.organizationName || ''}
                                onChange={(e) => updateSystemSettings({ organizationName: e.target.value })}
                                className="w-64 bg-tv-bg border border-tv-border text-tv-textPrimary text-sm rounded p-2 focus:border-tv-accent focus:outline-none"
                                placeholder="Enter organization name"
                            />
                        </div>
                    </TvCard>
                </section>

                {/* Audio Settings */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 text-tv-accent">
                        <Volume2 size={20} />
                        <TvText variant="h3">Audio Engine</TvText>
                    </div>
                    <TvCard className="p-6 space-y-6 bg-tv-panel/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <TvText variant="body" className="font-bold">Master (BGM) Volume</TvText>
                                <TvText variant="muted" className="text-xs">Adjust the overall sound intensity</TvText>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-mono text-tv-accent w-8 text-right">{systemSettings.volume}%</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={systemSettings.volume}
                                    onChange={(e) => updateSystemSettings({ volume: parseInt(e.target.value) })}
                                    className="w-48 accent-tv-accent cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <TvText variant="body" className="font-bold">SFX Volume</TvText>
                                <TvText variant="muted" className="text-xs">Adjust the intensity of sound effects</TvText>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-mono text-tv-accent w-8 text-right">{systemSettings.sfxVolume}%</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={systemSettings.sfxVolume}
                                    onChange={(e) => updateSystemSettings({ sfxVolume: parseInt(e.target.value) })}
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
                                onClick={() => updateSystemSettings({ sfxEnabled: !systemSettings.sfxEnabled })}
                                className={cn(
                                    "w-12 h-6 rounded-full relative transition-colors duration-300",
                                    systemSettings.sfxEnabled ? "bg-tv-accent" : "bg-tv-panel border border-tv-border"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 w-4 h-4 rounded-full transition-all duration-300",
                                    systemSettings.sfxEnabled ? "right-1 bg-tv-bg" : "left-1 bg-tv-textMuted"
                                )} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <TvText variant="body" className="font-bold">Background Music</TvText>
                                <TvText variant="muted" className="text-xs">Toggle ambient background soundtrack</TvText>
                            </div>
                            <button
                                onClick={() => updateSystemSettings({ bgmEnabled: !systemSettings.bgmEnabled })}
                                className={cn(
                                    "w-12 h-6 rounded-full relative transition-colors duration-300",
                                    systemSettings.bgmEnabled ? "bg-tv-accent" : "bg-tv-panel border border-tv-border"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 w-4 h-4 rounded-full transition-all duration-300",
                                    systemSettings.bgmEnabled ? "right-1 bg-tv-bg" : "left-1 bg-tv-textMuted"
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
                                    onClick={() => updateSystemSettings({ theme: 'dark' })}
                                    className={cn(
                                        "px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2",
                                        systemSettings.theme === 'dark' ? "bg-tv-accent text-tv-bg shadow-sm" : "text-tv-textMuted hover:text-tv-textPrimary"
                                    )}
                                >
                                    <Moon size={14} />
                                    Dark
                                </button>
                                <button
                                    onClick={() => updateSystemSettings({ theme: 'light' })}
                                    className={cn(
                                        "px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2",
                                        systemSettings.theme === 'light' ? "bg-tv-accent text-tv-bg shadow-sm" : "text-tv-textMuted hover:text-tv-textPrimary"
                                    )}
                                >
                                    <Sun size={14} />
                                    Light
                                </button>
                                <button
                                    onClick={() => updateSystemSettings({ theme: 'glossy' })}
                                    className={cn(
                                        "px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2",
                                        systemSettings.theme === 'glossy' ? "bg-tv-accent text-tv-bg shadow-sm" : "text-tv-textMuted hover:text-tv-textPrimary"
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
                                value={systemSettings.particleDensity}
                                onChange={(e) => updateSystemSettings({ particleDensity: e.target.value as any })}
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
