import React, { ReactNode } from 'react'
import { TvPanel } from '../components/ui/TvPanel'

type CommandCenterLayoutProps = {
    sidebar?: ReactNode
    children: ReactNode
    tools?: ReactNode
}

export function CommandCenterLayout({
    sidebar,
    children,
    tools
}: CommandCenterLayoutProps) {
    return (
        <div className="flex h-full w-full gap-6 p-6">
            {sidebar && (
                <TvPanel elevation="raised" padding="none" className="w-[280px] h-full flex flex-col overflow-hidden shrink-0">
                    {sidebar}
                </TvPanel>
            )}

            <div className="flex-1 h-full overflow-hidden flex flex-col gap-6">
                {children}
            </div>

            {tools && (
                <TvPanel elevation="raised" padding="none" className="w-[300px] h-full flex flex-col overflow-hidden shrink-0">
                    {tools}
                </TvPanel>
            )}
        </div>
    )
}
