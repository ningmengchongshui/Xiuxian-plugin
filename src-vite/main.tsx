import React, { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import './input.css'
import 'preline/dist/preline.js'
import LoadDing from './loading.tsx'

// eslint-disable-next-line react-refresh/only-export-components
const HomeApp = lazy(() => import('./view/home/App.tsx'))
// eslint-disable-next-line react-refresh/only-export-components
const LoginApp = lazy(() => import('./view/login/App.tsx'))
const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeApp />
  },
  {
    path: '/login',
    element: <LoginApp />
  }
])
createRoot(document.getElementById('root')!).render(
  <Suspense fallback={<LoadDing />}>
    <RouterProvider router={router} />
  </Suspense>
)