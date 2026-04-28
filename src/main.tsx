import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from './app/layout/AppShell'
import { CanvasPage } from './app/canvas/CanvasPage'
import { ObjectsPage } from './app/objects/ObjectsPage'
import { AssignmentsPage } from './app/assignments/AssignmentsPage'
import { LoginPage } from './auth/LoginPage'
import { RequireAuth } from './auth/RequireAuth'
import './index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/canvas" replace />} />
              <Route path="canvas" element={<CanvasPage />} />
              <Route path="objects" element={<ObjectsPage />} />
              <Route path="assignments" element={<AssignmentsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
