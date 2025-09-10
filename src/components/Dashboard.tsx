import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Calendar } from './ui/calendar'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { StudentManagement } from './StudentManagement'
import { WeeklyCalendar } from './WeeklyCalendar'
import { toast } from 'sonner@2.0.3'
import { 
  Calendar as CalendarIcon, 
  Users, 
  BookOpen, 
  Clock, 
  Plus, 
  Trash2,
  CreditCard,
  User
} from 'lucide-react'

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

interface DashboardProps {
  user: any
  userData: any
  onUpdateUserData: (userData: any) => void
}

export function Dashboard({ user, userData, onUpdateUserData }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [lessons, setLessons] = useState([])
  const [students, setStudents] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [newLesson, setNewLesson] = useState({
    title: '',
    date: '',
    time: '',
    studentId: '',
    description: ''
  })

  useEffect(() => {
    fetchLessons()
    if (['admin', 'teacher'].includes(userData?.role)) {
      fetchStudents()
    }
  }, [userData])

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const fetchLessons = async () => {
    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-fc610ba0/lessons`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      if (response.ok) {
        setLessons(data.lessons || [])
      }
    } catch (error) {
      console.error('Failed to fetch lessons:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-fc610ba0/students`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      if (response.ok) {
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const createLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-fc610ba0/lessons`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLesson)
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Урок создан успешно!')
        setNewLesson({ title: '', date: '', time: '', studentId: '', description: '' })
        fetchLessons()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to create lesson:', error)
      toast.error('Ошибка при создании урока')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteLesson = async (lessonId: string) => {
    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-fc610ba0/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success('Урок удален')
        fetchLessons()
      } else {
        throw new Error('Failed to delete lesson')
      }
    } catch (error) {
      console.error('Failed to delete lesson:', error)
      toast.error('Ошибка при удалении урока')
    }
  }



  const upcomingLessons = lessons.filter(lesson => {
    const lessonDate = new Date(lesson.date)
    return lessonDate >= new Date()
  }).slice(0, 5)

  const lessonDates = lessons.map(lesson => new Date(lesson.date + 'T00:00:00'))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="mb-2">
          Добро пожаловать, {userData?.name}!
        </h1>
        <p className="text-gray-600">
          {userData?.role === 'admin' ? 'Панель администратора' : 
           userData?.role === 'teacher' ? 'Панель преподавателя' : 
           'Личный кабинет ученика'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="calendar">Календарь</TabsTrigger>
          <TabsTrigger value="lessons">Уроки</TabsTrigger>
          {['admin', 'teacher'].includes(userData?.role) && (
            <TabsTrigger value="students">Ученики</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Balance Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {['admin', 'teacher'].includes(userData?.role) ? 'Всего учеников' : 'Баланс уроков'}
                </CardTitle>
                {['admin', 'teacher'].includes(userData?.role) ? (
                  <Users className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {['admin', 'teacher'].includes(userData?.role) ? students.length : userData?.balance || 0}
                  {userData?.role === 'student' && (
                    <span className="text-sm text-gray-500 ml-1">уроков</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Lessons */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ближайшие уроки</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingLessons.length}</div>
              </CardContent>
            </Card>

            {/* Total Lessons */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего уроков</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lessons.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => setActiveTab('calendar')}>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Открыть календарь
                </Button>
                
                {['admin', 'teacher'].includes(userData?.role) && (
                  <>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Создать урок
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Новый урок</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={createLesson} className="space-y-4">
                          <div>
                            <Label htmlFor="title">Название урока</Label>
                            <Input
                              id="title"
                              value={newLesson.title}
                              onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                              placeholder="Например: Основы JavaScript"
                              required
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="date">Дата</Label>
                              <Input
                                id="date"
                                type="date"
                                value={newLesson.date}
                                onChange={(e) => setNewLesson({...newLesson, date: e.target.value})}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="time">Время</Label>
                              <Input
                                id="time"
                                type="time"
                                value={newLesson.time}
                                onChange={(e) => setNewLesson({...newLesson, time: e.target.value})}
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="student">Ученик</Label>
                            <Select value={newLesson.studentId} onValueChange={(value) => setNewLesson({...newLesson, studentId: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите ученика" />
                              </SelectTrigger>
                              <SelectContent>
                                {students.map((student) => (
                                  <SelectItem key={student.id} value={student.id}>
                                    {student.name} ({student.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="description">Описание</Label>
                            <Textarea
                              id="description"
                              value={newLesson.description}
                              onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                              placeholder="Что будем изучать на уроке..."
                            />
                          </div>

                          <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? 'Создание...' : 'Создать урок'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" onClick={() => setActiveTab('students')}>
                      <Users className="w-4 h-4 mr-2" />
                      Управление учениками
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Lessons */}
          <Card>
            <CardHeader>
              <CardTitle>Ближайшие уроки</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingLessons.length > 0 ? (
                <div className="space-y-4">
                  {upcomingLessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{lesson.title}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(lesson.date).toLocaleDateString('ru-RU')} в {lesson.time}
                        </p>
                        {lesson.description && (
                          <p className="text-sm text-gray-500 mt-1">{lesson.description}</p>
                        )}
                      </div>
                      <Badge variant="outline">{lesson.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Нет запланированных уроков
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <WeeklyCalendar 
            userData={userData}
            lessons={lessons}
            students={students}
            onLessonCreated={fetchLessons}
          />
        </TabsContent>

        <TabsContent value="lessons" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Все уроки</CardTitle>
                <CardDescription>
                  История и планируемые занятия
                </CardDescription>
              </div>
              {['admin', 'teacher'].includes(userData?.role) && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить урок
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Новый урок</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={createLesson} className="space-y-4">
                      <div>
                        <Label htmlFor="title">Название урока</Label>
                        <Input
                          id="title"
                          value={newLesson.title}
                          onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                          placeholder="Например: Основы JavaScript"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="date">Дата</Label>
                          <Input
                            id="date"
                            type="date"
                            value={newLesson.date}
                            onChange={(e) => setNewLesson({...newLesson, date: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="time">Время</Label>
                          <Input
                            id="time"
                            type="time"
                            value={newLesson.time}
                            onChange={(e) => setNewLesson({...newLesson, time: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="student">Ученик</Label>
                        <Select value={newLesson.studentId} onValueChange={(value) => setNewLesson({...newLesson, studentId: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите ученика" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name} ({student.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="description">Описание</Label>
                        <Textarea
                          id="description"
                          value={newLesson.description}
                          onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                          placeholder="Что будем изучать на уроке..."
                        />
                      </div>

                      <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Создание...' : 'Создать урок'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {lessons.length > 0 ? (
                <div className="space-y-4">
                  {lessons
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((lesson) => (
                      <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{lesson.title}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(lesson.date).toLocaleDateString('ru-RU')} в {lesson.time}
                          </p>
                          {lesson.description && (
                            <p className="text-sm text-gray-500 mt-1">{lesson.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{lesson.status}</Badge>
                          {['admin', 'teacher'].includes(userData?.role) && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteLesson(lesson.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Уроков пока нет
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {['admin', 'teacher'].includes(userData?.role) && (
          <TabsContent value="students" className="space-y-6">
            <StudentManagement userData={userData} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}