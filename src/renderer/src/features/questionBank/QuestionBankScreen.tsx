import React, { useState, useEffect } from 'react'
import { CommandCenterLayout } from '../../layouts/CommandCenterLayout'
import { TvButton } from '../../components/ui/TvButton'
import { TvCard } from '../../components/ui/TvCard'
import { TvText } from '../../components/ui/TvText'
import { TvPanel } from '../../components/ui/TvPanel'
import { Database, Plus, Upload, Edit3, Trash2, Search, Filter, Loader2, ArrowLeft, X, Save, Download, Image as ImageIcon, Sigma, Type, Pencil } from 'lucide-react'
import { Question, useQuizStore } from '../../store/useQuizStore'
import { TvQuestionRenderer } from '../../components/ui/TvQuestionRenderer'

export function QuestionBankScreen() {
    const { setUiScreen } = useQuizStore()
    const [collections, setCollections] = useState<string[]>([])
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
    const [currentQuestions, setCurrentQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [uploadTarget, setUploadTarget] = useState<string | null>(null)

    // Modals
    const [showNewCollectionModal, setShowNewCollectionModal] = useState(false)
    const [newCollectionName, setNewCollectionName] = useState('')
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
    const [renameTarget, setRenameTarget] = useState<string | null>(null)
    const [renameValue, setRenameValue] = useState('')

    useEffect(() => {
        loadCollections()
    }, [])

    const loadCollections = async () => {
        const list = await window.api.getCollections()
        setCollections(list)
        if (list.length > 0 && !selectedCollection) {
            handleSelectCollection(list[0])
        }
    }

    const handleSelectCollection = async (name: string) => {
        setSelectedCollection(name)
        setLoading(true)
        const data = await window.api.getCollection(name)
        setCurrentQuestions(data || [])
        setLoading(false)
    }

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) return
        const success = await window.api.createCollection(newCollectionName)
        if (success) {
            await loadCollections()
            handleSelectCollection(newCollectionName)
            setNewCollectionName('')
            setShowNewCollectionModal(false)
        }
    }

    const handleRenameCollection = async () => {
        if (!renameTarget || !renameValue.trim()) return
        const success = await window.api.renameCollection(renameTarget, renameValue.trim())
        if (success) {
            await loadCollections()
            if (selectedCollection === renameTarget) {
                setSelectedCollection(renameValue.trim())
            }
            setRenameTarget(null)
            setRenameValue('')
        }
    }

    const handleDeleteCollection = async (name: string) => {
        if (window.confirm(`Are you sure you want to delete the collection "${name}"?`)) {
            const success = await window.api.deleteCollection(name)
            if (success) {
                await loadCollections()
                if (selectedCollection === name) {
                    setSelectedCollection(null)
                    setCurrentQuestions([])
                }
            }
        }
    }

    const handleSaveQuestion = async (q: Question) => {
        if (!selectedCollection) return
        const updatedQuestions = editingQuestion?.id && editingQuestion.id !== ''
            ? currentQuestions.map(item => item.id === editingQuestion.id ? q : item)
            : [...currentQuestions, { ...q, id: `q${Date.now()}` }]

        const success = await window.api.saveCollection(selectedCollection, updatedQuestions)
        if (success) {
            setCurrentQuestions(updatedQuestions)
            setEditingQuestion(null)
        }
    }

    const handleDeleteQuestion = async (id: string) => {
        if (!selectedCollection) return
        if (window.confirm('Delete this question?')) {
            const updated = currentQuestions.filter(q => q.id !== id)
            const success = await window.api.saveCollection(selectedCollection, updated)
            if (success) {
                setCurrentQuestions(updated)
            }
        }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (event) => {
            const text = event.target?.result as string
            if (!text) return

            const questions: Question[] = []
            const blocks = text.split('---').map(b => b.trim()).filter(b => b.length > 0)

            blocks.forEach((block, index) => {
                const lines = block.split('\n').map(l => l.trim())
                const q: Partial<Question> = {
                    id: `q${Date.now()}_${index}`,
                    options: { A: '', B: '', C: '', D: '' },
                    used: false
                }

                lines.forEach(line => {
                    const cleanLine = line.trim()
                    if (cleanLine.startsWith('Q:')) q.question = cleanLine.replace('Q:', '').trim()
                    if (cleanLine.startsWith('A:')) q.options!.A = cleanLine.replace('A:', '').trim()
                    if (cleanLine.startsWith('B:')) q.options!.B = cleanLine.replace('B:', '').trim()
                    if (cleanLine.startsWith('C:')) q.options!.C = cleanLine.replace('C:', '').trim()
                    if (cleanLine.startsWith('D:')) q.options!.D = cleanLine.replace('D:', '').trim()
                    if (cleanLine.startsWith('ANS:')) q.answer = cleanLine.replace('ANS:', '').trim() as 'A' | 'B' | 'C' | 'D'
                })

                if (q.question && q.answer) {
                    questions.push(q as Question)
                }
            })

            if (questions.length > 0) {
                // If we have an explicit target, append. Otherwise create new.
                const collectionName = uploadTarget || file.name.replace('.txt', '')

                // If appending, get existing first
                let finalQuestions = questions
                if (uploadTarget) {
                    const existing = await window.api.getCollection(uploadTarget)
                    finalQuestions = [...(existing || []), ...questions]
                }

                const success = await window.api.saveCollection(collectionName, finalQuestions)
                if (success) {
                    await loadCollections()
                    handleSelectCollection(collectionName)
                }
            }

            // Reset upload state
            setUploadTarget(null)
            e.target.value = ''
        }
        reader.readAsText(file)
    }

    const handleDownloadSample = () => {
        const sampleText = `Q: Which planet is known as the Red Planet?
A: Venus
B: Mars
C: Jupiter
D: Saturn
ANS: B
---
Q: What is the largest mammal on Earth?
A: Elephant
B: Blue Whale
C: Great White Shark
D: Giraffe
ANS: B
---
Q: Which element has the highest electrical conductivity?
A: Copper
B: Gold
C: Silver
D: Aluminum
ANS: C`

        const blob = new Blob([sampleText], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'mcq_format_sample.txt'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const filteredQuestions = currentQuestions.filter(q =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Expanded Symbols and Formulas
    const symbolCategories = [
        { name: 'Math', symbols: ['√', '±', '∞', '∑', '∏', '∫', '∆', '∇', '≈', '≠', '≤', '≥', '×', '÷', 'ˆ'] },
        { name: 'Greek', symbols: ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω'] },
        { name: 'Logic', symbols: ['∀', '∃', '∈', '∉', '⊂', '⊃', '∪', '∩', '∧', '∨', '¬', '⇒', '⇔'] }
    ]

    const formulaTemplates = [
        { name: 'Basic', code: '\\frac{a}{b}', label: 'Fraction' },
        { name: 'Basic', code: '\\sqrt{x}', label: 'Square Root' },
        { name: 'Basic', code: '\\sqrt[n]{x}', label: 'Nth Root' },
        { name: 'Power', code: 'x^{n}', label: 'Exponent' },
        { name: 'Power', code: 'x_{i}', label: 'Subscript' },
        { name: 'Power', code: 'x_{i}^{n}', label: 'Both' },
        { name: 'Advanced', code: '\\sum_{i=1}^{n}', label: 'Sum' },
        { name: 'Advanced', code: '\\int_{a}^{b}', label: 'Integral' },
        { name: 'Advanced', code: '\\lim_{x \\to \\infty}', label: 'Limit' },
        { name: 'Matrix', code: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', label: 'Matrix' }
    ]

    return (
        <CommandCenterLayout
            sidebar={
                <div className="h-full flex flex-col p-4 gap-6">
                    <div className="flex items-center gap-3">
                        <TvButton variant="ghost" size="sm" iconLeft={<ArrowLeft size={18} />} onClick={() => setUiScreen('COMMAND_CENTER')} />
                        <TvText variant="h3">Collections</TvText>
                    </div>

                    <TvButton
                        variant="secondary"
                        size="sm"
                        className="w-full justify-start border-dashed border-tv-accent/30"
                        iconLeft={<Plus size={16} />}
                        onClick={() => setShowNewCollectionModal(true)}
                    >
                        New Collection
                    </TvButton>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {collections.map(name => (
                            <TvCard
                                key={name}
                                hoverable
                                selected={selectedCollection === name}
                                className="p-3 group"
                                onClick={() => handleSelectCollection(name)}
                            >
                                <div className="flex justify-between items-center gap-2">
                                    <TvText variant="muted" className="truncate font-semibold text-xs flex-1">{name}</TvText>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            className="p-1 hover:text-tv-accent transition-all"
                                            onClick={(e) => { e.stopPropagation(); setRenameTarget(name); setRenameValue(name); }}
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button
                                            className="p-1 hover:text-tv-danger transition-all"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteCollection(name); }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </TvCard>
                        ))}
                    </div>
                </div>
            }
            tools={
                <div className="h-full flex flex-col p-6 gap-8">
                    <TvText variant="label">Tools Rack</TvText>

                    <div className="space-y-4">
                        <TvButton
                            variant="primary"
                            size="md"
                            className="w-full"
                            iconLeft={<Plus size={18} />}
                            disabled={!selectedCollection}
                            onClick={() => setEditingQuestion({ id: '', question: '', options: { A: '', B: '', C: '', D: '' }, answer: 'A', used: false })}
                        >
                            ADD QUESTION
                        </TvButton>

                        <TvButton
                            variant="secondary"
                            size="md"
                            className="w-full"
                            iconLeft={<Upload size={18} />}
                            onClick={() => {
                                setUploadTarget(null)
                                document.getElementById('file-upload')?.click()
                            }}
                        >
                            UPLOAD FILE (.txt)
                        </TvButton>
                        <input type="file" id="file-upload" className="hidden" accept=".txt" onChange={handleUpload} />

                        <TvButton
                            variant="ghost"
                            size="sm"
                            className="w-full text-[10px] border border-tv-border hover:border-tv-accent/30"
                            iconLeft={<Download size={14} />}
                            onClick={handleDownloadSample}
                        >
                            DOWNLOAD SAMPLE (.txt)
                        </TvButton>
                    </div>

                    <div className="mt-10 space-y-4">
                        <TvText variant="label">Search / Filter</TvText>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tv-textMuted" />
                            <input
                                className="w-full bg-tv-bg border border-tv-border rounded-md pl-9 pr-4 py-2 text-xs text-tv-textPrimary focus:border-tv-accent outline-none"
                                placeholder="Find question..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-auto p-4 rounded-lg bg-tv-accentSoft/50 border border-tv-accent/20">
                        <TvText variant="muted" className="text-[10px] leading-relaxed">
                            Questions are stored as local JSON collections. Importing from .txt automatically creates a new collection.
                        </TvText>
                    </div>
                </div>
            }
        >
            {/* Center Stage Card */}
            <TvPanel elevation="raised" padding="lg" className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="flex justify-between items-end border-b border-tv-border pb-6">
                    <div>
                        <TvText variant="h2" className="text-xl">{selectedCollection || 'No Collection Active'}</TvText>
                        <TvText variant="muted" className="text-xs uppercase tracking-[0.2em]">{currentQuestions.length} Items Indexed</TvText>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar pb-20">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-tv-textMuted">
                            <Loader2 className="animate-spin" size={32} />
                            <TvText variant="muted">Syncing Stages...</TvText>
                        </div>
                    ) : filteredQuestions.length > 0 ? (
                        filteredQuestions.map((q, i) => (
                            <TvCard key={q.id || i} animated className="p-6 flex flex-col gap-4 border-l-2 border-l-transparent hover:border-l-tv-accent transition-all group">
                                <div className="flex justify-between items-start">
                                    <TvText variant="muted" className="text-[10px] font-orbitron text-tv-accent">STAGE CARD {i + 1}</TvText>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TvButton variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingQuestion(q)}><Edit3 size={14} /></TvButton>
                                        <TvButton variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-tv-danger" onClick={() => handleDeleteQuestion(q.id)}><Trash2 size={14} /></TvButton>
                                    </div>
                                </div>
                                <TvQuestionRenderer text={q.question} className="text-lg leading-relaxed" />
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2">
                                    {(['A', 'B', 'C', 'D'] as const).map(key => (
                                        <div key={key} className={`flex items-baseline gap-3 text-xs ${q.answer === key ? 'text-tv-success' : 'text-tv-textMuted'}`}>
                                            <span className="font-orbitron font-bold opacity-60">{key}.</span>
                                            <span className="truncate">{q.options[key]}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-tv-border flex items-center justify-between">
                                    <TvText variant="label" className="text-[8px] opacity-40">✔ CORRECT ANSWER: {q.answer} // {q.options[q.answer]}</TvText>
                                </div>
                            </TvCard>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
                            <div className="p-8 rounded-full bg-tv-panel border border-tv-border shadow-panel">
                                <Database size={48} className="text-tv-textMuted/20" />
                            </div>
                            <div className="space-y-2">
                                <TvText variant="h3" className="text-tv-textMuted">No Stages in Current Vector</TvText>
                                <TvText variant="muted" className="max-w-xs mx-auto">Upload a source file or add questions manually to populate this collection.</TvText>
                            </div>

                            {selectedCollection && (
                                <TvButton
                                    variant="secondary"
                                    size="md"
                                    iconLeft={<Upload size={18} />}
                                    onClick={() => {
                                        setUploadTarget(selectedCollection)
                                        document.getElementById('file-upload')?.click()
                                    }}
                                >
                                    IMPORT FROM SOURCE (.txt)
                                </TvButton>
                            )}
                        </div>
                    )}
                </div>
            </TvPanel>

            {/* Editing Question Modal */}
            {editingQuestion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8">
                    <TvCard className="w-full max-w-2xl p-8 space-y-6 max-h-full overflow-y-auto" animated>
                        <div className="flex justify-between items-center border-b border-tv-border pb-4">
                            <TvText variant="h3">{editingQuestion.id ? 'EDIT QUESTION' : 'NEW QUESTION'}</TvText>
                            <button onClick={() => setEditingQuestion(null)}><X className="text-tv-textMuted hover:text-white" /></button>
                        </div>
                        <div className="space-y-6 text-left">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <TvText variant="label">Question Text</TvText>
                                    <div className="flex gap-3">
                                        {/* Formula Menu */}
                                        <div className="group relative">
                                            <button title="Insert Formula" className="p-2 hover:bg-tv-accentSoft hover:text-tv-accent rounded transition-colors duration-200">
                                                <Sigma size={18} />
                                            </button>
                                            <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-64 bg-tv-panel border border-tv-border p-3 rounded-lg shadow-2xl z-[70] animate-fadeIn">
                                                <div className="text-[10px] font-bold text-tv-accent uppercase mb-2 tracking-wider">Formula Templates</div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {formulaTemplates.map(f => (
                                                        <button
                                                            key={f.label}
                                                            onClick={() => setEditingQuestion({ ...editingQuestion, question: editingQuestion.question + ` $$${f.code}$$ ` })}
                                                            className="text-[10px] text-left p-2 hover:bg-tv-bg rounded border border-transparent hover:border-tv-border transition-all"
                                                        >
                                                            <div className="text-tv-textMuted mb-1">{f.label}</div>
                                                            <code className="text-tv-accent opacity-80 whitespace-nowrap overflow-hidden text-ellipsis block">{f.code}</code>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Symbol Menu */}
                                        <div className="group relative">
                                            <button title="Insert Symbol" className="p-2 hover:bg-tv-accentSoft hover:text-tv-accent rounded transition-colors duration-200">
                                                <Type size={18} />
                                            </button>
                                            <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-48 bg-tv-panel border border-tv-border p-3 rounded-lg shadow-2xl z-[70] animate-fadeIn">
                                                {symbolCategories.map(cat => (
                                                    <div key={cat.name} className="mb-3 last:mb-0">
                                                        <div className="text-[9px] font-bold text-tv-textMuted uppercase mb-1 tracking-widest">{cat.name}</div>
                                                        <div className="grid grid-cols-5 gap-1">
                                                            {cat.symbols.map(s => (
                                                                <button
                                                                    key={s}
                                                                    onClick={() => setEditingQuestion({ ...editingQuestion, question: editingQuestion.question + s })}
                                                                    className="w-7 h-7 flex items-center justify-center hover:bg-tv-accent hover:text-tv-bg rounded text-xs transition-all"
                                                                >
                                                                    {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Image Button */}
                                        <button
                                            title="Insert Image"
                                            onClick={() => {
                                                const input = document.createElement('input')
                                                input.type = 'file'
                                                input.accept = 'image/*'
                                                input.onchange = (e: any) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        const path = file.path || URL.createObjectURL(file)
                                                        setEditingQuestion({ ...editingQuestion, question: editingQuestion.question + `\n![Image](${path})\n` })
                                                    }
                                                }
                                                input.click()
                                            }}
                                            className="p-2 hover:bg-tv-accentSoft hover:text-tv-accent rounded transition-colors duration-200"
                                        >
                                            <ImageIcon size={18} />
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    className="w-full bg-tv-bg border border-tv-border rounded-lg px-4 py-3 font-body text-tv-textPrimary outline-none focus:border-tv-accent min-h-[120px] custom-scrollbar"
                                    value={editingQuestion.question}
                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                                    placeholder="Enter question text here... Use $x$ for inline math or $$x$$ for blocks."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {(['A', 'B', 'C', 'D'] as const).map(key => (
                                    <div key={key} className="space-y-2">
                                        <TvText variant="label" className={editingQuestion.answer === key ? 'text-tv-success' : ''}>
                                            Option {key} {editingQuestion.answer === key && '(ACTIVE)'}
                                        </TvText>
                                        <div className="flex gap-2">
                                            <input
                                                className={`flex-1 bg-tv-bg border rounded-lg px-4 py-2 text-sm text-tv-textPrimary outline-none transition-colors ${editingQuestion.answer === key ? 'border-tv-success/50' : 'border-tv-border focus:border-tv-accent'}`}
                                                value={editingQuestion.options[key]}
                                                onChange={(e) => setEditingQuestion({
                                                    ...editingQuestion,
                                                    options: { ...editingQuestion.options, [key]: e.target.value }
                                                })}
                                            />
                                            <button
                                                onClick={() => setEditingQuestion({ ...editingQuestion, answer: key })}
                                                className={`w-10 rounded-lg border flex items-center justify-center transition-all ${editingQuestion.answer === key ? 'bg-tv-success text-white border-tv-success' : 'bg-tv-bg border-tv-border text-tv-textMuted'}`}
                                            >
                                                {key}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-tv-border">
                                <TvButton variant="ghost" className="flex-1" onClick={() => setEditingQuestion(null)}>CANCEL</TvButton>
                                <TvButton variant="primary" className="flex-1" iconLeft={<Save size={18} />} onClick={() => handleSaveQuestion(editingQuestion)}>
                                    SAVE STAGE
                                </TvButton>
                            </div>
                        </div>
                    </TvCard>
                </div>
            )}

            {/* Collection Creation Modal */}
            {showNewCollectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8">
                    <TvCard className="w-full max-w-md p-8 space-y-6" animated>
                        <div className="flex justify-between items-center border-b border-tv-border pb-4">
                            <TvText variant="h3">NEW COLLECTION</TvText>
                            <button onClick={() => setShowNewCollectionModal(false)}><X className="text-tv-textMuted hover:text-white" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <TvText variant="label">Collection Identifier</TvText>
                                <input
                                    className="w-full bg-tv-bg border border-tv-border rounded-lg px-4 py-3 font-display text-primary outline-none focus:border-tv-accent"
                                    placeholder="e.g. Science Round 1"
                                    value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-4">
                                <TvButton variant="ghost" className="flex-1" onClick={() => setShowNewCollectionModal(false)}>CANCEL</TvButton>
                                <TvButton variant="primary" className="flex-1" onClick={handleCreateCollection}>CREATE DOCK</TvButton>
                            </div>
                        </div>
                    </TvCard>
                </div>
            )}

            {/* Collection Rename Modal */}
            {renameTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8">
                    <TvCard className="w-full max-w-md p-8 space-y-6" animated>
                        <div className="flex justify-between items-center border-b border-tv-border pb-4">
                            <TvText variant="h3">RENAME COLLECTION</TvText>
                            <button onClick={() => setRenameTarget(null)}><X className="text-tv-textMuted hover:text-white" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <TvText variant="label">New Identifier</TvText>
                                <input
                                    className="w-full bg-tv-bg border border-tv-border rounded-lg px-4 py-3 font-display text-tv-accent outline-none focus:border-tv-accent"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-4">
                                <TvButton variant="ghost" className="flex-1" onClick={() => setRenameTarget(null)}>CANCEL</TvButton>
                                <TvButton variant="primary" className="flex-1" onClick={handleRenameCollection}>UPDATE DOCK</TvButton>
                            </div>
                        </div>
                    </TvCard>
                </div>
            )}
        </CommandCenterLayout>
    )
}
