import React, { useState, useEffect } from 'react'
import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './utils/supabase/info'
import { HomePage } from './components/HomePage'
import { AuthPage } from './components/AuthPage'
import { Dashboard } from './components/Dashboard'
import { Button } from './components/ui/button'
import { Toaster } from './components/ui/sonner'
import { toast } from 'sonner@2.0.3'

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

export default function App() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('home')

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        await fetchUserData(session.access_token)
      }
    } catch (error) {
      console.error('Session check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserData = async (accessToken) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-fc610ba0/user/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserData(data.user)
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    }
  }

  const handleAuth = (user, userData) => {
    setUser(user)
    setUserData(userData)
    setCurrentPage('dashboard')
    toast.success('Добро пожаловать!')
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserData(null)
      setCurrentPage('home')
      toast.success('Вы вышли из системы')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Ошибка при выходе')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setCurrentPage('home')}
                className="text-xl font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                HT
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    Привет, {userData?.name || user.email}
                    {userData?.role === 'admin' && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Админ
                      </span>
                    )}
                    {userData?.role === 'teacher' && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Преподаватель
                      </span>
                    )}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage('dashboard')}
                  >
                    Личный кабинет
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                  >
                    Выйти
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setCurrentPage('auth')}
                >
                  Войти
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
        {currentPage === 'home' && <HomePage onLogin={() => setCurrentPage('auth')} />}
        {currentPage === 'auth' && <AuthPage onAuth={handleAuth} />}
        {currentPage === 'dashboard' && user && (
          <Dashboard 
            user={user} 
            userData={userData} 
            onUpdateUserData={setUserData}
          />
        )}
      </main>

      <Toaster position="top-right" />
    </div>
  )
}