import React, { useState } from 'react'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  return (
    <>
      <Topbar onToggleSidebar={() => setSidebarOpen(v => !v)} />
      <div className={`layout ${sidebarOpen ? '' : 'collapsed'}`}>
        <Sidebar />
        <main className="content">{children}</main>
      </div>
    </>
  )
}
