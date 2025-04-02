import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components'

const MainLayout = () => {
  return (
    <div className="flex max-h-screen">
      <Helmet>
        <title>Zalo</title>
      </Helmet>
      <Sidebar />
      <main className="w-full overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
