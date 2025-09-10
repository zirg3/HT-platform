import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { toast } from 'sonner@2.0.3'
import { ChevronLeft, ChevronRight, Plus, Clock, User, Edit, Trash2 } from 'lucide-react'

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

interface WeeklyCalendarProps {
  userData: any
  lessons: any[]
  students: any[]
  onLessonCreated: () => void
}

export function WeeklyCalendar({ userData, lessons, students, onLessonCreated }: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [newLesson, setNewLesson] = useState({
    title: '',
    date: '',
    time: '',
    studentId: '',
    description: ''
  })

  // Генерация временных слотов с 8:00 до 22:00 с интервалом 30 минут
  const timeSlots = []
  for (let hour = 8; hour <= 22; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
    if (hour < 22) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
  }

  // Получение дней недели
  const getWeekDays = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
    startOfWeek.setDate(diff)
    
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(startOfWeek)
      weekDay.setDate(startOfWeek.getDate() + i)
      week.push(weekDay)
    }
    return week
  }

  const weekDays = getWeekDays(currentWeek)

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const handleSlotClick = (date: Date, time: string) => {
    const dateStr = formatDate(date)
    setSelectedSlot({ date: dateStr, time })
    setNewLesson({
      title: '',
      date: dateStr,
      time: time,
      studentId: '',
      description: ''
    })
    setIsCreateModalOpen(true)
  }

  const getLessonsForSlot = (date: Date, time: string) => {
    const dateStr = formatDate(date)
    return lessons.filter(lesson => 
      lesson.date === dateStr && lesson.time === time
    )
  }

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
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
        setIsCreateModalOpen(false)
        onLessonCreated()
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

  const updateLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLesson) return
    setIsLoading(true)

    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-fc610ba0/lessons/${editingLesson.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingLesson)
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Урок обновлен успешно!')
        setIsEditModalOpen(false)
        setEditingLesson(null)
        onLessonCreated()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to update lesson:', error)
      toast.error('Ошибка при обновлении урока')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот урок?')) return

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
        onLessonCreated()
      } else {
        throw new Error('Failed to delete lesson')
      }
    } catch (error) {
      console.error('Failed to delete lesson:', error)
      toast.error('Ошибка при удалении урока')
    }
  }

  const handleLessonClick = (lesson: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingLesson({ ...lesson })
    setIsEditModalOpen(true)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const getCurrentTimeSlot = () => {
    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()
    
    if (hour < 8 || hour >= 22) return null
    
    const timeSlot = minute < 30 
      ? `${hour.toString().padStart(2, '0')}:00`
      : `${hour.toString().padStart(2, '0')}:30`
    
    return timeSlot
  }

  const isCurrentTimeSlot = (time: string, date: Date) => {
    if (!isToday(date)) return false
    return getCurrentTimeSlot() === time
  }

  const getLessonColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 hover:bg-green-600'
      case 'cancelled':
        return 'bg-red-500 hover:bg-red-600'
      case 'rescheduled':
        return 'bg-yellow-500 hover:bg-yellow-600'
      default:
        return 'bg-blue-500 hover:bg-blue-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Проведен'
      case 'cancelled':
        return 'Отменен'
      case 'rescheduled':
        return 'Перенесен'
      default:
        return 'Запланирован'
    }
  }

  return (
    <div className="w-full">
      {/* Header с навигацией */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Календарь уроков</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('prev')}
                  className="cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium min-w-[200px] text-center">
                  {weekDays[0].toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('next')}
                  className="cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button
                onClick={() => setCurrentWeek(new Date())}
                variant="outline"
                size="sm"
              >
                Сегодня
              </Button>
            </div>
          </div>
          
          {/* Легенда статусов */}
          <div className="flex items-center space-x-6 text-sm">
            <span className="text-gray-600">Статусы уроков:</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Запланирован</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Проведен</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Перенесен</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Отменен</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Основная сетка календаря */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header с днями недели */}
              <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-10">
                <div className="p-4 border-r border-gray-200">
                  <span className="text-sm text-gray-500">Время</span>
                </div>
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${
                      isToday(day) ? 'bg-blue-50 text-blue-600 font-medium' : ''
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {formatDisplayDate(day)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Временные слоты */}
              <div className="max-h-[600px] overflow-y-auto">
                {timeSlots.map((time) => (
                  <div key={time} className="grid grid-cols-8 border-b border-gray-100 hover:bg-gray-50">
                    {/* Колонка времени */}
                    <div className="p-3 border-r border-gray-200 text-sm text-gray-600 text-center bg-gray-50">
                      {time}
                    </div>
                    
                    {/* Ячейки дней */}
                    {weekDays.map((day) => {
                      const dayLessons = getLessonsForSlot(day, time)
                      return (
                        <div
                          key={`${day.toISOString()}-${time}`}
                          className={`p-2 border-r border-gray-200 last:border-r-0 min-h-[60px] cursor-pointer hover:bg-blue-50 transition-colors relative ${
                            isToday(day) ? 'bg-blue-25' : ''
                          } ${
                            isCurrentTimeSlot(time, day) ? 'bg-yellow-100 border-l-4 border-l-yellow-500' : ''
                          }`}
                          onClick={() => ['admin', 'teacher'].includes(userData?.role) && handleSlotClick(day, time)}
                        >
                          {dayLessons.length > 0 ? (
                            <div className="space-y-1">
                              {dayLessons.map((lesson) => {
                                const student = students.find(s => s.id === lesson.studentId)
                                return (
                                  <div
                                    key={lesson.id}
                                    className={`${getLessonColor(lesson.status)} text-white text-xs p-2 rounded shadow-sm cursor-pointer transition-colors group relative`}
                                    onClick={(e) => handleLessonClick(lesson, e)}
                                    title={`${lesson.title} - ${getStatusText(lesson.status)}`}
                                  >
                                    <div className="font-medium truncate">
                                      {lesson.title}
                                    </div>
                                    {student && (
                                      <div className="flex items-center mt-1 opacity-90">
                                        <User className="w-3 h-3 mr-1" />
                                        <span className="truncate">{student.name}</span>
                                      </div>
                                    )}
                                    {['admin', 'teacher'].includes(userData?.role) && (
                                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleLessonClick(lesson, e)
                                          }}
                                          className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded p-1"
                                          title="Редактировать урок"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            deleteLesson(lesson.id)
                                          }}
                                          className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded p-1"
                                          title="Удалить урок"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            ['admin', 'teacher'].includes(userData?.role) && (
                              <div className="flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity">
                                <Plus className="w-4 h-4 text-gray-400" />
                              </div>
                            )
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Модальное окно создания урока */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать урок</DialogTitle>
            <DialogDescription>
              {selectedSlot && `${selectedSlot.date} в ${selectedSlot.time}`}
            </DialogDescription>
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
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Создание...' : 'Создать урок'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Модальное окно просмотра/редактирования урока */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {['admin', 'teacher'].includes(userData?.role) ? 'Редактировать урок' : 'Детали урока'}
            </DialogTitle>
            <DialogDescription>
              {['admin', 'teacher'].includes(userData?.role) 
                ? 'Изменение существующего урока' 
                : 'Информация о запланированном уроке'
              }
            </DialogDescription>
          </DialogHeader>
          {editingLesson && (
            <form onSubmit={updateLesson} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Название урока</Label>
                <Input
                  id="edit-title"
                  value={editingLesson.title}
                  onChange={(e) => setEditingLesson({...editingLesson, title: e.target.value})}
                  placeholder="Например: Основы JavaScript"
                  required
                  disabled={!['admin', 'teacher'].includes(userData?.role)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-date">Дата</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingLesson.date}
                    onChange={(e) => setEditingLesson({...editingLesson, date: e.target.value})}
                    required
                    disabled={!['admin', 'teacher'].includes(userData?.role)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-time">Время</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={editingLesson.time}
                    onChange={(e) => setEditingLesson({...editingLesson, time: e.target.value})}
                    required
                    disabled={!['admin', 'teacher'].includes(userData?.role)}
                  />
                </div>
              </div>

              {['admin', 'teacher'].includes(userData?.role) && (
                <div>
                  <Label htmlFor="edit-student">Ученик</Label>
                  <Select 
                    value={editingLesson.studentId} 
                    onValueChange={(value) => setEditingLesson({...editingLesson, studentId: value})}
                    disabled={!['admin', 'teacher'].includes(userData?.role)}
                  >
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
              )}

              <div>
                <Label htmlFor="edit-status">Статус</Label>
                <Select 
                  value={editingLesson.status} 
                  onValueChange={(value) => setEditingLesson({...editingLesson, status: value})}
                  disabled={!['admin', 'teacher'].includes(userData?.role)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Запланирован</SelectItem>
                    <SelectItem value="completed">Проведен</SelectItem>
                    <SelectItem value="cancelled">Отменен</SelectItem>
                    <SelectItem value="rescheduled">Перенесен</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-description">Описание</Label>
                <Textarea
                  id="edit-description"
                  value={editingLesson.description || ''}
                  onChange={(e) => setEditingLesson({...editingLesson, description: e.target.value})}
                  placeholder="Что будем изучать на уроке..."
                  rows={3}
                  disabled={!['admin', 'teacher'].includes(userData?.role)}
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1"
                >
                  {['admin', 'teacher'].includes(userData?.role) ? 'Отмена' : 'Закрыть'}
                </Button>
                {['admin', 'teacher'].includes(userData?.role) && (
                  <>
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={() => {
                        setIsEditModalOpen(false)
                        deleteLesson(editingLesson.id)
                      }}
                      className="px-6"
                    >
                      Удалить
                    </Button>
                    <Button type="submit" disabled={isLoading} className="flex-1">
                      {isLoading ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                  </>
                )}
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}