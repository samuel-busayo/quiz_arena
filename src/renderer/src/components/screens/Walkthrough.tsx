import { useState } from 'react'
import { TechButton } from '../ui/TechButton'
import { TechCard } from '../ui/TechCard'
import { ChevronRight, ChevronLeft, Award, Tv, Users, Database } from 'lucide-react'

interface WalkthroughProps {
    onComplete: () => void
}

export function Walkthrough({ onComplete }: WalkthroughProps) {
    const [step, setStep] = useState(0)

    const steps = [
        {
            title: "Welcome to the Arena",
            description: "TechVerse Quiz Arena is a professional-grade competition software designed for high-stakes school events.",
            icon: <Award className="w-16 h-16 text-primary-accent" />,
            color: "text-primary-accent"
        },
        {
            title: "Dual Screen Experience",
            description: "Connect a second display to enable the Projector View. Keep the Admin Console on your main screen to control the show.",
            icon: <Tv className="w-16 h-16 text-team-blue" />,
            color: "text-team-blue"
        },
        {
            title: "Manage Your Data",
            description: "Import questions from .txt or .docx files and organize them into collections. Everything stays offline on your device.",
            icon: <Database className="w-16 h-16 text-team-green" />,
            color: "text-team-green"
        },
        {
            title: "Ready to Compete?",
            description: "Configure your teams, rounds, and rules. Let the games begin!",
            icon: <Users className="w-16 h-16 text-team-orange" />,
            color: "text-team-orange"
        }
    ]

    const next = () => {
        if (step < steps.length - 1) setStep(step + 1)
        else onComplete()
    }

    const prev = () => {
        if (step > 0) setStep(step - 1)
    }

    return (
        <div className="h-screen w-screen bg-primary-bg flex items-center justify-center p-8">
            <TechCard className="max-w-xl w-full flex flex-col items-center text-center p-12 gap-8" glow>
                <div className="relative">
                    <div className="absolute inset-0 blur-2xl opacity-20 bg-primary-accent rounded-full animate-pulse" />
                    {steps[step].icon}
                </div>

                <div className="space-y-4">
                    <h2 className={`text-4xl font-orbitron uppercase tracking-widest ${steps[step].color}`}>
                        {steps[step].title}
                    </h2>
                    <p className="text-primary-secondary font-inter text-lg leading-relaxed">
                        {steps[step].description}
                    </p>
                </div>

                {/* Progress Dots */}
                <div className="flex gap-2">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary-accent' : 'w-2 bg-primary-surface border border-white/10'}`}
                        />
                    ))}
                </div>

                <div className="flex gap-4 w-full mt-4">
                    {step > 0 && (
                        <TechButton variant="secondary" onClick={prev} className="flex-1">
                            <ChevronLeft className="mr-2" size={18} /> BACK
                        </TechButton>
                    )}
                    <TechButton variant="primary" onClick={next} className="flex-1">
                        {step === steps.length - 1 ? "GET STARTED" : "CONTINUE"} <ChevronRight className="ml-2" size={18} />
                    </TechButton>
                </div>
            </TechCard>
        </div>
    )
}
