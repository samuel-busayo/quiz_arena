import React, { useEffect, useState } from 'react'
import { TvButton } from '../../components/ui/TvButton'
import { TvCard } from '../../components/ui/TvCard'
import { TvText } from '../../components/ui/TvText'
import { TvPanel } from '../../components/ui/TvPanel'
import { ArrowLeft, Book, Keyboard, Cpu, Info, ShieldCheck, Zap, ExternalLink, Globe, Github } from 'lucide-react'
import { useQuizStore } from '../../store/useQuizStore'

export function HelpAboutScreen() {
    const { setUiScreen, systemSettings } = useQuizStore()
    const [version, setVersion] = useState('v1.0.0')

    useEffect(() => {
        window.api.getVersion().then(v => setVersion(`v${v}`))
    }, [])

    return (
        <div className="h-full w-full flex flex-col p-8 gap-8 max-w-6xl mx-auto overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-tv-border pb-6">
                <div className="flex items-center gap-4">
                    <TvButton variant="ghost" size="sm" iconLeft={<ArrowLeft size={18} />} onClick={() => setUiScreen('COMMAND_CENTER')} />
                    <div>
                        <TvText variant="h1" className="text-2xl">SYSTEM MANUAL</TvText>
                        <TvText variant="muted">{version} // Mission Control OS</TvText>
                    </div>
                </div>
                <div className="flex gap-4">
                    <TvButton variant="ghost" size="sm" iconLeft={<Globe size={18} />} />
                    <TvButton variant="ghost" size="sm" iconLeft={<Github size={18} />} />
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
                {/* Left Column: Documentation */}
                <div className="col-span-8 overflow-y-auto space-y-8 pr-4 custom-scrollbar pb-24">
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-tv-accent">
                            <Book size={20} />
                            <TvText variant="h3">Mission Operations (Host Guide)</TvText>
                        </div>
                        <TvCard className="p-6 space-y-6 bg-tv-panel/30 border-tv-accent/10">
                            <ManualStep num={1} title="Initial Arming" text="Navigate to 'Start Quiz Simulation'. Select your mission vector (JSON file), configure the strike team (up to 4 teams), and establish engagement rules (Timer/Lifelines)." />
                            <ManualStep num={2} title="Sync Projector" text="Ensure the Projection screen is active on a secondary display. Use 'View Standings' to verify synchronization before initiating contact." />
                            <ManualStep num={3} title="Stage Engagement" text="During the 'Picker Phase', the active team selects a data node (number). Once the question is decrypted, the system initiates the countdown." />
                            <ManualStep num={4} title="Result Verification" text="After the team locks in their response, the Host verifies it against the central core. Use 'Correct' or 'Wrong' to finalize the take." />
                            <ManualStep num={5} title="Termination Sequence" text="At the end of all rounds, the system automatically triggers the Cinematic Winner Sequence to crown the champion." />
                        </TvCard>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-tv-warning">
                            <Zap size={20} />
                            <TvText variant="h3">Operative Handbook (Player Guide)</TvText>
                        </div>
                        <TvCard className="p-6 space-y-6 bg-tv-panel/30 border-tv-warning/10">
                            <ManualStep num={1} title="Neural Selection" text="When it is your turn, choose a node from the grid. This node contains the data packet (question) you must decrypt." />
                            <ManualStep num={2} title="Rapid Response" text="You have a limited time window to respond. Consult with your team and provide the definitive answer to the Host." />
                            <ManualStep num={3} title="Lifeline Deployment" text="If configured, your team can deploy a '50/50' lifeline to eliminate two incorrect data nodes, increasing your chance of success." />
                            <ManualStep num={4} title="Stalemate Protocol" text="In the event of a tie, the system initiates a high-stakes Tie-Breaker. Each team gets one take until the deadlock is broken." />
                        </TvCard>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-tv-accent">
                            <Keyboard size={20} />
                            <TvText variant="h3">Neural Overrides (Shortcuts)</TvText>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <KeyShortcut k="A / B / C / D" action="Select Answer Option (Host)" />
                            <KeyShortcut k="Space" action="Pause/Resume Simulation" />
                            <KeyShortcut k="Tab" action="Cycle Active Team (Manual Override)" />
                            <KeyShortcut k="M" action="Toggle Audio Engine" />
                            <KeyShortcut k="L" action="Force Activate 50/50 Lifeline" />
                            <KeyShortcut k="F11" action="Toggle Fullscreen Immersive Mode" />
                        </div>
                    </section>
                </div>

                {/* Right Column: About/Tech Stack */}
                <div className="col-span-4 space-y-8 overflow-y-auto custom-scrollbar pb-24 pr-2">
                    <TvPanel elevation="raised" className="p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <Cpu size={24} className="text-tv-accent" />
                            <TvText variant="h3">Engine Specs</TvText>
                        </div>
                        <div className="space-y-4">
                            <TechItem label="Framework" val="React + Vite" />
                            <TechItem label="Runtime" val="Electron Core" />
                            <TechItem label="Styling" val="Tailwind CSS 3.4" />
                            <TechItem label="State" val="Zustand Neural Store" />
                            <TechItem label="Visuals" val="Lucide + Custom SVG" />
                        </div>
                    </TvPanel>

                    <TvPanel elevation="floating" className="p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <Info size={24} className="text-tv-accent" />
                            <TvText variant="h3">Developer Core</TvText>
                        </div>

                        <div className="space-y-6">
                            <DevItem
                                name="Olatunbosun Samuel Busayo"
                                role="CTO @ Coordi.Tech"
                                title="Fullstack Web Developer & Software Engineer"
                                link="https://www.linkedin.com/in/samuel-busayo-1b5b68237/"
                            />
                            <DevItem
                                name="Biose Peter John"
                                role="CTO @ BioLab"
                                title="Fullstack Web-Developer & Software Engineer"
                                link="#"
                            />
                        </div>

                        <div className="pt-4 border-t border-tv-border/20">
                            <TvText variant="muted" className="text-[10px] opacity-60 text-center block">
                                {systemSettings?.organizationName || 'Coordi.Tech'} Quiz Arena // Futuristic Quiz App
                            </TvText>
                            <TvText variant="muted" className="text-[10px] opacity-80 text-center block mt-1 uppercase text-tv-accent">
                                Powered by Coordi.Tech
                            </TvText>
                        </div>
                    </TvPanel>
                </div>
            </div>
        </div>
    )
}

function ManualStep({ num, title, text }: { num: number, title: string, text: string }) {
    return (
        <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-tv-accent text-tv-bg text-[10px] font-bold flex items-center justify-center shrink-0 mt-1">
                0{num}
            </div>
            <div>
                <TvText variant="body" className="font-bold text-sm tracking-wide">{title}</TvText>
                <TvText variant="muted" className="text-xs leading-relaxed mt-1">{text}</TvText>
            </div>
        </div>
    )
}

function KeyShortcut({ k, action }: { k: string, action: string }) {
    return (
        <div className="flex justify-between items-center p-3 rounded-md bg-tv-panel border border-tv-border">
            <TvText variant="muted" className="text-xs">{action}</TvText>
            <div className="px-2 py-0.5 rounded bg-tv-bg border border-white/10 font-timer text-[10px] text-tv-accent shadow-sm">
                {k}
            </div>
        </div>
    )
}

function TechItem({ label, val }: { label: string, val: string }) {
    return (
        <div className="flex justify-between border-b border-tv-border/10 pb-2">
            <TvText variant="label" className="opacity-60">{label}</TvText>
            <TvText variant="muted" className="text-xs font-mono">{val}</TvText>
        </div>
    )
}

function DevItem({ name, role, title, link }: { name: string, role: string, title?: string, link: string }) {
    return (
        <div className="space-y-1">
            <TvText variant="body" className="font-bold text-sm text-tv-textPrimary">{name}</TvText>
            <TvText variant="muted" className="text-[12px] block text-tv-accent leading-tight">{role}</TvText>
            {title && <TvText variant="muted" className="text-[10px] block opacity-70 leading-tight mb-1">{title}</TvText>}
            <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-tv-accent hover:underline mt-1"
            >
                Connect on LinkedIn <ExternalLink size={10} />
            </a>
        </div>
    )
}
