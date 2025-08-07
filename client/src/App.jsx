// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import Toast from "./components/toast/Toast"
import EditorPage from "./pages/EditorPage"
import HomePage from "./pages/HomePage"
import AuthPage from "./pages/AuthPage"
import { ViewContextProvider } from "./context/ViewContext" // ✅ ADD THIS

const AppRoutes = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <Routes>
      {!user ? (
        <Route path="*" element={<AuthPage onAuthSuccess={() => {}} />} />
      ) : (
        <>
          <Route path="/" element={<HomePage />} />
          {/* ✅ Wrap EditorPage in ViewContextProvider */}
          <Route
            path="/editor/:roomId"
            element={
              <ViewContextProvider>
                <EditorPage />
              </ViewContextProvider>
            }
          />
          <Route path="*" element={<HomePage />} />
        </>
      )}
    </Routes>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toast />
      </Router>
    </AuthProvider>
  )
}

export default App
