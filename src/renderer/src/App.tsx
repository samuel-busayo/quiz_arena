import React, { useEffect } from 'react'
import { useQuizStore } from './store/useQuizStore'

// Layouts
import { MainShell } from './layouts/MainShell'

// Features
import { CommandCenterScreen } from './features/app/CommandCenterScreen'
import { QuestionBankScreen } from './features/questionBank/QuestionBankScreen'
import { QuizSetupScreen } from './features/quizSetup/QuizSetupScreen'
import { AdminConsoleScreen } from './features/simulation/AdminConsoleScreen'
import { ProjectionScreen } from './features/simulation/ProjectionScreen'
import { HelpAboutScreen } from './features/app/HelpAboutScreen'
import { SettingsScreen } from './features/app/SettingsScreen'
import { ResultsHistoryScreen } from './screens/ResultsHistoryScreen'

function App() {
    const { initialize, uiScreen } = useQuizStore()

    useEffect(() => {
        // Detect window role
        const isProjector = window.location.search.includes('projector')
        const view = isProjector ? 'projector' : 'admin'

        // Identity for global shortcut logic
        window.name = view

        initialize(view)
    }, [initialize])

    // Detect View Role
    const isProjector = window.location.search.includes('projector')

    if (isProjector) {
        return (
            <MainShell>
                <ProjectionScreen />
            </MainShell>
        )
    }

    // Admin View Routing
    return (
        <MainShell>
            {uiScreen === 'COMMAND_CENTER' && <CommandCenterScreen />}
            {uiScreen === 'QUESTION_BANK' && <QuestionBankScreen />}
            {uiScreen === 'QUIZ_SETUP' && <QuizSetupScreen />}
            {uiScreen === 'SIMULATION_CONSOLE' && <AdminConsoleScreen />}
            {uiScreen === 'HELP_ABOUT' && <HelpAboutScreen />}
            {uiScreen === 'SETTINGS' && <SettingsScreen />}
            {uiScreen === 'RESULTS_HISTORY' && <ResultsHistoryScreen />}
        </MainShell>
    )
}

export default App
