import { useQuizStore, QuizState, QuizResult, Question } from '../../store/useQuizStore'
import { audioEngine } from './AudioEngine'
import failsafeBank from '../../data/failsafe_bank.json'

class QuizSimulationEngine {
    private timerId: number | null = null
    private lastTick: number = 0

    // Core Actions
    startSimulation() {
        const { questions, config, teams } = useQuizStore.getState()
        if (!config || teams.length === 0) return

        // 1. Lock/Initialize teams
        const initialTeams = teams.map(t => ({
            ...t,
            score: 0,
            isEliminated: false,
            lifelineRemaining: config.lifelineConfig.enabled ? config.lifelineConfig.usesPerTeam : 0
        }))
        useQuizStore.setState({ teams: initialTeams })

        // 2. Initial State Setup
        useQuizStore.setState({
            currentRound: 1,
            currentTake: 1,
            currentTeamId: initialTeams[0].id,
            revealStatus: null,
            selectedOption: null,
            isPaused: false,
            uiOverlay: null,
            eliminatedOptions: [],
            isLocked: false,
            isConfirming: false,
            currentStats: [],
            scoreHistory: [],
            cinematicStage: 0
        })

        // Take initial snapshot
        useQuizStore.getState().recordHistorySnapshot('INITIAL_START')

        // 3. Grid / Queue Generation
        if (config.mode === 'PICK_NUMBER') {
            const count = questions.length
            let cols = 4
            if (count <= 12) cols = 4
            else if (count <= 20) cols = 5
            else if (count <= 30) cols = 6
            else cols = 7

            const gridNumbers = questions.map((_, i) => ({
                value: i + 1,
                used: false,
                questionIndex: i
            })).sort(() => Math.random() - 0.5)

            useQuizStore.setState({
                gridColumns: cols,
                gridNumbers: gridNumbers,
                currentPickerTeamId: initialTeams[0].id,
                selectionCursor: 0
            })
        } else {
            const queue = [...questions].sort(() => Math.random() - 0.5)
            useQuizStore.setState({ questionQueue: queue })
        }

        // 4. Trigger Intro Sequence (Arming)
        audioEngine.stopBgm()
        this.transitionTo('ARMING')

        // Automatically proceed to Round Intro after 5s Arming (Synchronized)
        setTimeout(() => {
            this.transitionTo('ROUND_INTRO')
            // Play ROUND_INTRO for 5s then start question logic
            setTimeout(() => {
                const state = useQuizStore.getState()
                if (state.config?.mode === 'PICK_NUMBER') {
                    this.transitionTo('PICKER_PHASE')
                } else {
                    const nextQ = this.pickNextRandomQuestion()
                    if (nextQ) {
                        useQuizStore.setState({ currentQuestion: nextQ })
                        this.transitionTo('QUESTION')
                    } else {
                        this.transitionTo('WINNER')
                    }
                }
            }, 5000)
        }, 5000)
    }

    transitionTo(phase: QuizState) {
        const { setCurrentState } = useQuizStore.getState()
        setCurrentState(phase)

        // Audio Triggers
        switch (phase) {
            case 'ROUND_INTRO':
                audioEngine.playSfx('bassHit')
                break
            case 'PICKER_PHASE':
                audioEngine.playBgm('leaderboard')
                break
            case 'QUESTION':
                useQuizStore.setState({
                    revealStatus: null,
                    selectedOption: null,
                    eliminatedOptions: [],
                    isPaused: false
                })
                audioEngine.playBgm('countdown', false)
                this.startTimer()
                break
            case 'ANSWER_REVEAL':
                this.stopTimer()
                break
            case 'LEADERBOARD':
                useQuizStore.getState().setUiOverlay('leaderboard')
                audioEngine.playBgm('leaderboard')
                break
            case 'ELIMINATION':
                useQuizStore.getState().setUiOverlay(null)
                // elimination SFX handled in advanceSimulation
                break
            case 'WINNER':
                useQuizStore.getState().setUiOverlay(null)
                audioEngine.playBgm('winner')
                this.handleQuizEnd()
                // Winner Mega Celebration Sequence is handled in ProjectionScreen
                // We just hold here. Manual action needed to close.
                break
            case 'IDLE':
                useQuizStore.getState().setUiOverlay(null)
                audioEngine.stopBgm()
                break
            case 'STANDBY':
                useQuizStore.getState().setUiOverlay(null)
                // BGM is handled by the Projection window
                break
            case 'TURN_INTRO':
                useQuizStore.getState().setUiOverlay(null)
                audioEngine.playSfx('bassHit')
                // 1. CLEAR ARTIFACTS IMMEDIATELY
                useQuizStore.setState({
                    eliminatedOptions: [],
                    selectedOption: null,
                    revealStatus: null,
                    isLocked: false,
                    isConfirming: false
                })

                // 2. Automated Proceed after cinematic delay (Requested: at least 5s)
                setTimeout(() => {
                    const state = useQuizStore.getState()
                    const config = state.config
                    if (config?.mode === 'PICK_NUMBER') {
                        this.transitionTo('PICKER_PHASE')
                    } else {
                        const nextQ = this.pickNextRandomQuestion()
                        if (nextQ) {
                            useQuizStore.setState({ currentQuestion: nextQ })
                            this.transitionTo('QUESTION')
                        } else {
                            // Pool exhausted during round
                            this.transitionTo('WINNER')
                        }
                    }
                }, 5000)
                break
            case 'TIE_BREAKER':
                useQuizStore.getState().setUiOverlay(null)
                audioEngine.playSfx('bassHit')
                useQuizStore.setState({
                    eliminatedOptions: [],
                    selectedOption: null,
                    revealStatus: null,
                    isLocked: false,
                    isConfirming: false,
                    currentTake: 1
                })

                // Hand control back to Admin to build suspense
                break
            case 'FAILSAFE_INTRO':
                useQuizStore.getState().setUiOverlay(null)
                // Hand control back to Admin to build suspense
                break
        }
    }

    // Pick-A-Number Logic
    handlePick(index: number) {
        const { gridNumbers, questions, currentTeamId, confirmPick } = useQuizStore.getState()
        const numObj = gridNumbers[index]
        if (!numObj || numObj.used || !currentTeamId) return

        // Set picking index to trigger animation
        useQuizStore.setState({ pickingIndex: index })

        // Play shot SFX
        audioEngine.playSfx('correct') // Update to a shot SFX later if available

        // Delay for the bull-eye gunshot animation
        setTimeout(() => {
            confirmPick(index, currentTeamId)

            const question = questions[numObj.questionIndex]
            useQuizStore.setState({
                currentQuestion: question,
                revealStatus: null,
                selectedOption: null,
                pickingIndex: null
            })

            this.transitionTo('QUESTION')
        }, 1500)
    }

    // Timer Logic
    private startTimer() {
        this.stopTimer()
        const { config } = useQuizStore.getState()
        if (!config) return

        useQuizStore.setState({ timerRemaining: config.timerSeconds })
        this.lastTick = performance.now()

        const tick = (now: number) => {
            const { isPaused, timerRemaining, currentState } = useQuizStore.getState()

            if (currentState !== 'QUESTION') {
                this.stopTimer()
                return
            }

            if (!isPaused) {
                const delta = now - this.lastTick
                if (delta >= 1000) {
                    const nextValue = Math.max(0, timerRemaining - 1)
                    useQuizStore.setState({ timerRemaining: nextValue })
                    this.lastTick = now

                    if (nextValue === 0) {
                        this.handleTimerEnd()
                        return
                    }
                }
            } else {
                this.lastTick = now
            }

            this.timerId = requestAnimationFrame(tick)
        }

        this.timerId = requestAnimationFrame(tick)
    }

    private stopTimer() {
        if (this.timerId) {
            cancelAnimationFrame(this.timerId)
            this.timerId = null
        }
    }

    pauseTimer() {
        useQuizStore.setState({ isPaused: true })
        // Stop BGM or lower volume? User didn't specify, but pausing countdown BGM is good
        audioEngine.stopBgm()
    }

    resumeTimer() {
        useQuizStore.setState({ isPaused: false })
        audioEngine.playBgm('countdown', false)
    }

    private handleTimerEnd() {
        // Auto submission of "wrong" on timeout
        const { currentTeamId, config, updateScore, currentQuestion, addQuestionStat } = useQuizStore.getState()

        if (currentTeamId && config) {
            audioEngine.playSfx('wrong')
            updateScore(currentTeamId, 0)
        }

        if (currentQuestion && currentTeamId && config) {
            addQuestionStat({
                questionId: currentQuestion.id,
                teamId: currentTeamId,
                correct: false,
                timeUsed: config.timerSeconds
            })
        }

        useQuizStore.setState({ revealStatus: 'timeout', selectedOption: null })
        this.transitionTo('ANSWER_REVEAL')

        // Auto advance after wrong reveal duration ~2.2s
        setTimeout(() => {
            this.advanceSimulation()
        }, 2200)
    }

    // --- CORE SELECTION FLOW ---

    selectAnswer(selection: 'A' | 'B' | 'C' | 'D') {
        const { currentState, isConfirming, isLocked } = useQuizStore.getState()
        if (currentState !== 'QUESTION' || isConfirming || isLocked) return

        this.pauseTimer()
        useQuizStore.setState({
            selectedOption: selection,
            isConfirming: true
        })
        audioEngine.playSfx('click')
    }

    cancelSelection() {
        const { isConfirming, isLocked } = useQuizStore.getState()
        if (!isConfirming || isLocked) return

        useQuizStore.setState({
            isConfirming: false,
            selectedOption: null
        })
        this.resumeTimer()
    }

    async confirmAnswer() {
        const { isConfirming, isLocked, selectedOption, currentQuestion } = useQuizStore.getState()
        if (!isConfirming || isLocked || !selectedOption || !currentQuestion) return

        useQuizStore.setState({ isLocked: true })

        // STAGE 1: Suspense Freeze (0.6s)
        audioEngine.playSfx('bassHit')
        // Projection UI will show "FINAL ANSWER LOCKED"
        await new Promise(resolve => setTimeout(resolve, 600))

        this.revealAnswer(selectedOption)
    }

    private async revealAnswer(selection: 'A' | 'B' | 'C' | 'D' | null) {
        const { currentTeamId, config, updateScore, timerRemaining, currentQuestion, addQuestionStat } = useQuizStore.getState()
        if (!currentQuestion || !currentTeamId || !config) return

        this.stopTimer()

        const isCorrect = selection === currentQuestion.answer
        const revealStatus = selection === null ? 'timeout' : isCorrect ? 'correct' : 'wrong'

        // STAGE 2: Reveal Burst (1.2s for correct, 0.4s + 0.9s for wrong)
        useQuizStore.setState({
            currentState: 'ANSWER_REVEAL',
            revealStatus,
            selectedOption: selection,
            isConfirming: false,
            isLocked: false
        })

        // STAGE 2: STAGED REVEAL (5 seconds total - ALWAYS performed to build suspense)
        const options: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D']
        const wrongOptions = options.filter(opt => opt !== currentQuestion.answer)

        // 1. Reveal two wrong options NOT selected by the team (if possible)
        const unselectedWrong = wrongOptions.filter(opt => opt !== selection)

        // Sequence:
        // Delay 1: First wrong (1s)
        useQuizStore.setState({ eliminatedOptions: [unselectedWrong[0]] })
        audioEngine.playSfx('wrong')
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Delay 2: Second wrong (1s)
        useQuizStore.setState({ eliminatedOptions: [unselectedWrong[0], unselectedWrong[1]] })
        audioEngine.playSfx('wrong')
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Delay 3: Final wrong (which might be the selected one) (1s)
        const finalWrong = selection !== currentQuestion.answer ? selection! : wrongOptions.find(o => !unselectedWrong.includes(o))!
        useQuizStore.setState({ eliminatedOptions: [unselectedWrong[0], unselectedWrong[1], finalWrong] })
        if (selection === currentQuestion.answer) {
            audioEngine.playSfx('wrong')
        } else {
            audioEngine.playSfx('bassHit')
        }
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Delay 4: Green Highlight for Correct (2s)
        // This is where we finally confirm if stage 3 was an elimination of the selected option or a highlight of the correct one
        if (isCorrect) {
            audioEngine.playSfx('correct')
            useQuizStore.setState({ revealStatus: 'correct' })
        } else {
            useQuizStore.setState({ revealStatus: 'wrong' })
        }
        await new Promise(resolve => setTimeout(resolve, 2000))

        if (isCorrect) {
            updateScore(currentTeamId, config.scorePerCorrect)
            await new Promise(resolve => setTimeout(resolve, 800))
        } else {
            // Score Deduction - if config allows
            if (config.deductionPerWrong > 0) {
                updateScore(currentTeamId, -config.deductionPerWrong)
                await new Promise(resolve => setTimeout(resolve, 800))
            }
        }

        // Add Stat
        addQuestionStat({
            questionId: currentQuestion.id,
            teamId: currentTeamId,
            correct: isCorrect && selection !== null,
            timeUsed: config.timerSeconds - timerRemaining
        })

        // Record snapshot of game state after score update
        useQuizStore.getState().recordHistorySnapshot(currentQuestion.id)

        // Auto advance simulation
        this.advanceSimulation()
    }

    // Manual progression from Intro states (Tie Breaker / Failsafe)
    proceedFromIntro() {
        const { currentState } = useQuizStore.getState()
        if (currentState !== 'TIE_BREAKER' && currentState !== 'FAILSAFE_INTRO') return

        const nextQ = this.pickNextRandomQuestion()
        if (nextQ) {
            useQuizStore.setState({ currentQuestion: nextQ })
            this.transitionTo('QUESTION')
        } else if (currentState === 'TIE_BREAKER') {
            // Already handled in pickNextRandomQuestion (will trigger FAILSAFE_INTRO if needed)
            // But if it returns null and stays in TIE_BREAKER, it means truly exhausted
            const { isFailsafeActive } = useQuizStore.getState()
            if (isFailsafeActive) this.transitionTo('WINNER')
        } else {
            this.transitionTo('WINNER')
        }
    }

    advanceSimulation() {
        const { currentTake, config, teams, nextTake, nextTeam, currentState } = useQuizStore.getState()
        if (!config) return

        const activeTeams = teams.filter(t => !t.isEliminated)

        // Check if tie-breaker is active
        if (currentState === 'TIE_BREAKER') {
            this.handleTieBreakerProgress()
            return
        }

        const { currentTeamId, currentRound } = useQuizStore.getState()
        const oldTake = currentTake

        if (currentTake % activeTeams.length === 0) {
            // Balanced round cycle completed - trigger 5s leaderboard
            useQuizStore.getState().setUiOverlay('leaderboard')

            setTimeout(() => {
                useQuizStore.getState().setUiOverlay(null)
                if (currentTake >= config.takesPerRound * activeTeams.length) {
                    this.eliminateLowestTeam()
                } else {
                    useQuizStore.getState().nextTake()
                    useQuizStore.getState().nextTeam()
                    this.transitionTo('TURN_INTRO')
                }
            }, 5000)
        } else {
            useQuizStore.getState().nextTake()
            useQuizStore.getState().nextTeam()
            this.transitionTo('TURN_INTRO')
        }
    }

    private handleTieBreakerProgress() {
        const { currentTake, tieBreakerTeams, tieBreakerPurpose, teams, setTieBreakerTeams, currentTeamId, currentRound } = useQuizStore.getState()

        // Tie breaker is 1 take per team (currentTake is 1-indexed)
        if (currentTake >= tieBreakerTeams.length) {
            // Re-evaluate the stalemates after full loop
            const tiedTeamsData = teams.filter(t => tieBreakerTeams.includes(t.id))

            if (tieBreakerPurpose === 'winner') {
                const maxScore = Math.max(...tiedTeamsData.map(t => t.score))
                const winners = tiedTeamsData.filter(t => t.score === maxScore)

                if (winners.length === 1) {
                    useQuizStore.setState({ tieBreakerPurpose: null })
                    this.transitionTo('WINNER')
                } else {
                    // Still tied - show leaderboard then repeat
                    useQuizStore.getState().setUiOverlay('leaderboard')
                    setTimeout(() => {
                        useQuizStore.getState().setUiOverlay(null)
                        setTieBreakerTeams(winners.map(w => w.id))
                        useQuizStore.setState({ currentTake: 1, currentTeamId: winners[0].id, tieBreakerRound: useQuizStore.getState().tieBreakerRound + 1 })
                        this.transitionTo('TIE_BREAKER')
                    }, 5000)
                }
            } else if (tieBreakerPurpose === 'elimination') {
                const minScore = Math.min(...tiedTeamsData.map(t => t.score))
                const candidates = tiedTeamsData.filter(t => t.score === minScore)

                if (candidates.length === 1) {
                    const target = candidates[0]
                    useQuizStore.setState({ tieBreakerPurpose: null })
                    useQuizStore.getState().eliminateTeam(target.id)
                    useQuizStore.setState({ currentTeamId: target.id })
                    this.transitionTo('ELIMINATION')

                    setTimeout(() => {
                        const { config } = useQuizStore.getState()
                        if (config?.showLeaderboardAfterRound) {
                            this.transitionTo('LEADERBOARD')
                        } else {
                            this.startNextRound()
                        }
                    }, 5000)
                } else {
                    // Still tied - show leaderboard then repeat
                    useQuizStore.getState().setUiOverlay('leaderboard')
                    setTimeout(() => {
                        useQuizStore.getState().setUiOverlay(null)
                        setTieBreakerTeams(candidates.map(c => c.id))
                        useQuizStore.setState({ currentTake: 1, currentTeamId: candidates[0].id, tieBreakerRound: useQuizStore.getState().tieBreakerRound + 1 })
                        this.transitionTo('TIE_BREAKER')
                    }, 5000)
                }
            }
        } else {
            const nextIdx = currentTake
            const nextTeamId = tieBreakerTeams[nextIdx]

            useQuizStore.setState({
                currentTeamId: nextTeamId,
                currentTake: currentTake + 1
            })
            setTimeout(() => this.transitionTo('TURN_INTRO'), 2000)
        }
    }

    private eliminateLowestTeam() {
        const { teams, config } = useQuizStore.getState()
        const activeTeams = teams.filter(t => !t.isEliminated)

        if (activeTeams.length <= 1) {
            // Already winner status
            this.transitionTo('WINNER')
            return
        }

        // Find lowest
        const lowestScore = [...activeTeams].sort((a, b) => a.score - b.score)[0].score
        const candidates = activeTeams.filter(t => t.score === lowestScore)

        if (candidates.length > 1) {
            // TIE FOR ELIMINATION
            useQuizStore.getState().setTieBreakerTeams(candidates.map(c => c.id))
            useQuizStore.getState().setTieBreakerPurpose('elimination')
            useQuizStore.setState({ currentTeamId: candidates[0].id, tieBreakerRound: 1 })
            this.transitionTo('TIE_BREAKER')
            return
        }

        const lowest = candidates[0]

        // Mark eliminated
        useQuizStore.getState().eliminateTeam(lowest.id)
        useQuizStore.getState().recordHistorySnapshot(`ELIMINATION_${lowest.id}`)

        // Set state to ELIMINATION for UX
        useQuizStore.setState({ currentTeamId: lowest.id }) // Focus on them for UI
        audioEngine.playSfx('bassHit') // low bass drop
        this.transitionTo('ELIMINATION')

        // Elimination sequence is 5s. After that, either go to leaderboard or next round
        setTimeout(() => {
            if (config?.showLeaderboardAfterRound) {
                this.transitionTo('LEADERBOARD')
            } else {
                this.startNextRound()
            }
        }, 5000)
    }

    startNextRound() {
        const { currentRound, config, teams } = useQuizStore.getState()
        if (!config) return

        const activeTeams = teams.filter(t => !t.isEliminated)

        if (currentRound >= config.rounds || activeTeams.length <= 1) {
            // Check for Final Winner Tie
            const maxScore = [...activeTeams].sort((a, b) => b.score - a.score)[0].score
            const winners = activeTeams.filter(t => t.score === maxScore)

            if (winners.length > 1) {
                useQuizStore.getState().setTieBreakerTeams(winners.map(w => w.id))
                useQuizStore.getState().setTieBreakerPurpose('winner')
                useQuizStore.setState({ currentTeamId: winners[0].id, tieBreakerRound: 1 })
                this.transitionTo('TIE_BREAKER')
            } else {
                this.transitionTo('WINNER')
            }
        } else {
            useQuizStore.setState({
                currentRound: currentRound + 1,
                currentTake: 1,
                currentTeamId: activeTeams[0].id
            })

            this.transitionTo('ROUND_INTRO')
            setTimeout(() => {
                if (config.mode === 'PICK_NUMBER') {
                    this.transitionTo('PICKER_PHASE')
                } else {
                    const nextQ = this.pickNextRandomQuestion()
                    if (nextQ) {
                        useQuizStore.setState({ currentQuestion: nextQ })
                        this.transitionTo('QUESTION')
                    } else {
                        // Pool exhausted at round start
                        this.transitionTo('WINNER')
                    }
                }
            }, 5000)
        }
    }

    private handleQuizEnd() {
        const { config, teams, currentRound, currentStats, saveResult } = useQuizStore.getState()
        if (!config) return

        const finalScores: Record<string, number> = {}
        teams.forEach(t => { finalScores[t.id] = t.score })

        const winner = [...teams].sort((a, b) => b.score - a.score)[0]

        const result: QuizResult = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            setupSnapshot: config,
            teams,
            roundsPlayed: currentRound,
            takesPerRound: config.takesPerRound,
            finalScores,
            eliminationOrder: teams.filter(t => t.isEliminated).map(t => t.id), // Basic approximation
            winner: winner?.id || null,
            questionStats: currentStats
        }

        saveResult(result)
    }

    showLeaderboard() {
        const { currentState, uiOverlay } = useQuizStore.getState()
        if (uiOverlay === 'leaderboard') return

        // 1. Pause visual timer
        this.pauseTimer()

        // 2. Set overlay state
        useQuizStore.getState().setUiOverlay('leaderboard')
    }

    activate5050() {
        const { currentQuestion, currentTeamId, config, eliminatedOptions, currentState, isLocked, timerRemaining } = useQuizStore.getState()
        if (!currentQuestion || !currentTeamId || !config || !config.lifelineConfig.enabled) return
        if (currentState !== 'QUESTION' || isLocked || timerRemaining <= 0) return

        const team = useQuizStore.getState().teams.find(t => t.id === currentTeamId)
        if (!team || team.lifelineRemaining <= 0) return
        if (eliminatedOptions.length > 0) return // Already used on this question

        // LOGIC: Remove two wrong options
        const options: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D']
        const wrongOptions = options.filter(opt => opt !== currentQuestion.answer)

        // Shuffle and pick 2
        const toEliminate = wrongOptions
            .sort(() => Math.random() - 0.5)
            .slice(0, 2)

        // Update Store
        useQuizStore.setState({ eliminatedOptions: toEliminate })
        useQuizStore.getState().useLifeline(currentTeamId)
        useQuizStore.getState().syncState()

        // Audio Surge
        audioEngine.playSfx('click') // Placeholder for surge if needed
    }

    hideLeaderboard() {
        const { uiOverlay, currentState } = useQuizStore.getState()
        if (uiOverlay !== 'leaderboard') return

        // 1. Clear overlay
        useQuizStore.getState().setUiOverlay(null)

        // 2. Resume timer ONLY if we are in a phase that requires it
        if (currentState === 'QUESTION') {
            this.resumeTimer()
        }
    }

    initializeSimulation() {
        useQuizStore.getState().setCurrentState('STANDBY')
        window.api.openProjector()
        // BGM is handled by the Projection window
    }

    private pickNextRandomQuestion() {
        const { questionQueue, currentStats, tieBreakerPurpose, isFailsafeActive } = useQuizStore.getState()
        const nextIndex = currentStats.length

        if (nextIndex < questionQueue.length) {
            return questionQueue[nextIndex]
        }

        // Exhaustion!
        if (tieBreakerPurpose !== null) {
            if (!isFailsafeActive) {
                // Trigger the cinematic transition
                setTimeout(() => {
                    useQuizStore.getState().setFailsafeActive(true)
                    const currentQueue = useQuizStore.getState().questionQueue
                    const failsafe = (failsafeBank as Question[]).sort(() => Math.random() - 0.5)
                    useQuizStore.setState({ questionQueue: [...currentQueue, ...failsafe] })
                    this.transitionTo('FAILSAFE_INTRO')
                }, 10)
                return null
            }

            // If somehow exhausted even after failsafe? (Edge case)
            return null
        }

        console.warn('QuizSimulationEngine: Question pool exhausted.')
        return null
    }
}

export const simulationEngine = new QuizSimulationEngine()
