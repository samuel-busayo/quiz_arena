import React from 'react'
import 'katex/dist/katex.min.css'
import katex from 'katex'

type TvQuestionRendererProps = {
    text: string
    className?: string
}

export function TvQuestionRenderer({ text, className }: TvQuestionRendererProps) {
    if (!text) return null

    // Regex for inline math $...$ and block math $$...$$
    // Regex for images ![alt](url)

    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$|!\[.*?\]\(.*?\))/g);

    return (
        <div className={className}>
            {parts.map((part, index) => {
                if (part.startsWith('$$') && part.endsWith('$$')) {
                    const formula = part.slice(2, -2)
                    try {
                        return (
                            <div
                                key={index}
                                className="my-4 flex justify-center overflow-x-auto"
                                dangerouslySetInnerHTML={{
                                    __html: katex.renderToString(formula, { displayMode: true, throwOnError: false })
                                }}
                            />
                        )
                    } catch {
                        return <span key={index}>{part}</span>
                    }
                }

                if (part.startsWith('$') && part.endsWith('$')) {
                    const formula = part.slice(1, -1)
                    try {
                        return (
                            <span
                                key={index}
                                dangerouslySetInnerHTML={{
                                    __html: katex.renderToString(formula, { displayMode: false, throwOnError: false })
                                }}
                            />
                        )
                    } catch {
                        return <span key={index}>{part}</span>
                    }
                }

                if (part.startsWith('![') && part.includes('](')) {
                    const alt = part.match(/\[(.*?)\]/)?.[1] || ''
                    const url = part.match(/\((.*?)\)/)?.[1] || ''
                    return (
                        <div key={index} className="my-4 flex justify-center">
                            <img
                                src={url}
                                alt={alt}
                                className="max-w-full rounded-lg border border-tv-border shadow-panel max-h-[300px] object-contain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                }}
                            />
                        </div>
                    )
                }

                return <span key={index} className="whitespace-pre-wrap">{part}</span>
            })}
        </div>
    )
}
