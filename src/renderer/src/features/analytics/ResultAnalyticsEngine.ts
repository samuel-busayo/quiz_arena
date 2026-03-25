import { QuizResult } from '../../store/useQuizStore'

export type TeamStats = {
    teamId: string
    teamName: string
    accuracy: number
    avgSpeed: number
    totalCorrect: number
    totalQuestions: number
}

export class ResultAnalyticsEngine {
    static getTeamStats(result: QuizResult): TeamStats[] {
        const stats: TeamStats[] = []

        result.teams.forEach(team => {
            const teamQuestions = result.questionStats.filter(s => s.teamId === team.id)
            const total = teamQuestions.length
            const correct = teamQuestions.filter(s => s.correct).length
            const totalSpeed = teamQuestions.reduce((acc, curr) => acc + curr.timeUsed, 0)

            stats.push({
                teamId: team.id,
                teamName: team.name,
                accuracy: total > 0 ? (correct / total) * 100 : 0,
                avgSpeed: total > 0 ? totalSpeed / total : 0,
                totalCorrect: correct,
                totalQuestions: total
            })
        })

        return stats
    }

    static getRoundTrends(result: QuizResult) {
        // Simple aggregation of total correct answers per round
        const rounds: Record<number, number> = {}
        result.questionStats.forEach(stat => {
            // Since we don't store round in QuestionStat directly yet, 
            // we'd need to infer or add it. Let's assume we focus on Team performance for now.
        })
        return rounds
    }

    static getGlobalAccuracy(result: QuizResult): number {
        const total = result.questionStats.length
        const correct = result.questionStats.filter(s => s.correct).length
        return total > 0 ? (correct / total) * 100 : 0
    }
}
