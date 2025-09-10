import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { toast } from 'sonner@2.0.3'
import { 
  User, 
  UserPlus, 
  BookOpen, 
  Code, 
  Cpu, 
  Box,
  DollarSign,
  ArrowUpCircle,
  Settings
} from 'lucide-react'

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

interface StudentManagementProps {
  userData: any
}

const subjects = {
  frontend: { name: 'Frontend разработка', icon: Code, color: 'bg-blue-100 text-blue-800' },
  python: { name: 'Python программирование', icon: Cpu, color: 'bg-green-100 text-green-800' },
  '3d_modeling': { name: '3D моделирование', icon: Box, color: 'bg-purple-100 text-purple-800' }
}

export function StudentManagement({ userData }: StudentManagementProps) {
  const [students, setStudents] = useState([])
  const [newStudents, setNewStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [assignForm, setAssignForm] = useState({
    subject: '',
    teacherId: userData?.role === 'teacher' ? userData.id : ''
  })
  const [balanceForm, setBalanceForm] = useState({
    studentId: '',
    amount: 0,
    operation: 'add'
  })

  useEffect(() => {
    fetchStudents()
    if (userData?.role === 'admin') {
      fetchTeachers()
    }
  }, [userData])

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
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
        setNewStudents(data.newStudents || [])
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const fetchTeachers = async () => {
    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-fc610ba0/teachers`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      if (response.ok) {
        setTeachers(data.teachers || [])
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    }
  }

  const assignStudent = async (studentId: string) => {
    if (!assignForm.subject) {
      toast.error('Выберите предмет')
      return
    }

    setLoading(true)
    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-fc610ba0/students/${studentId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teacherId: assignForm.teacherId,
          subject: assignForm.subject
        })
      })

      if (response.ok) {
        toast.success('Ученик успешно закреплен!')
        setAssignForm({ subject: '', teacherId: userData?.role === 'teacher' ? userData.id : '' })
        setSelectedStudent(null)
        fetchStudents()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      console.error('Failed to assign student:', error)
      toast.error('Ошибка при закреплении ученика')
    } finally {
      setLoading(false)
    }
  }

  const changeTeacher = async (studentId: string, teacherId: string, subject: string) => {
    setLoading(true)
    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-fc610ba0/students/${studentId}/change-teacher`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teacherId,
          subject
        })
      })

      if (response.ok) {
        toast.success('Преподаватель изменен!')
        fetchStudents()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      console.error('Failed to change teacher:', error)
      toast.error('Ошибка при изменении преподавателя')
    } finally {
      setLoading(false)
    }
  }

  const updateBalance = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-fc610ba0/students/${balanceForm.studentId}/balance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: balanceForm.amount,
          operation: balanceForm.operation
        })
      })

      if (response.ok) {
        toast.success('Баланс обновлен!')
        setBalanceForm({ studentId: '', amount: 0, operation: 'add' })
        fetchStudents()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      console.error('Failed to update balance:', error)
      toast.error('Ошибка при обновлении баланса')
    } finally {
      setLoading(false)
    }
  }

  const getSubjectInfo = (subject: string) => {
    return subjects[subject] || { name: subject, icon: BookOpen, color: 'bg-gray-100 text-gray-800' }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">
            {userData?.role === 'admin' ? 'Все ученики' : 'Мои ученики'}
          </TabsTrigger>
          <TabsTrigger value="new">
            Новые ученики ({newStudents.length})
          </TabsTrigger>
          <TabsTrigger value="balance">Управление балансом</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>
                {userData?.role === 'admin' ? 'Все ученики' : 'Мои ученики'}
              </CardTitle>
              <CardDescription>
                {userData?.role === 'admin' 
                  ? 'Управление всеми учениками на платформе'
                  : 'Ваши закрепленные ученики'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length > 0 ? (
                <div className="space-y-4">
                  {students.map((student) => {
                    const subjectInfo = getSubjectInfo(student.subject)
                    const SubjectIcon = subjectInfo.icon
                    return (
                      <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{student.name}</h4>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            {student.subject && (
                              <div className="flex items-center space-x-2 mt-1">
                                <SubjectIcon className="w-4 h-4" />
                                <Badge variant="outline" className={subjectInfo.color}>
                                  {subjectInfo.name}
                                </Badge>
                              </div>
                            )}
                            {student.teacherName && userData?.role === 'admin' && (
                              <p className="text-xs text-gray-500 mt-1">
                                Преподаватель: {student.teacherName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              {student.balance || 0} уроков
                            </div>
                            <Badge variant={student.balance > 0 ? 'default' : 'secondary'}>
                              {student.balance > 0 ? 'Активен' : 'Нет баланса'}
                            </Badge>
                          </div>
                          {userData?.role === 'admin' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Settings className="w-4 h-4 mr-2" />
                                  Изменить
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Изменить преподавателя</DialogTitle>
                                  <DialogDescription>
                                    Смена преподавателя для {student.name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Предмет</Label>
                                    <Select 
                                      defaultValue={student.subject}
                                      onValueChange={(subject) => {
                                        const teacherId = assignForm.teacherId || teachers[0]?.id
                                        if (teacherId) {
                                          changeTeacher(student.id, teacherId, subject)
                                        }
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Выберите предмет" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(subjects).map(([key, info]) => (
                                          <SelectItem key={key} value={key}>
                                            {info.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Преподаватель</Label>
                                    <Select 
                                      defaultValue={student.teacher}
                                      onValueChange={(teacherId) => {
                                        if (student.subject) {
                                          changeTeacher(student.id, teacherId, student.subject)
                                        }
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Выберите преподавателя" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {teachers.map((teacher) => (
                                          <SelectItem key={teacher.id} value={teacher.id}>
                                            {teacher.name} {teacher.role === 'admin' ? '(Админ)' : '(Преподаватель)'} {teacher.role === 'admin' ? '(Админ)' : '(Преподаватель)'}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {userData?.role === 'admin' ? 'Учеников пока нет' : 'У вас нет закрепленных учеников'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>Новые ученики</CardTitle>
              <CardDescription>
                Ученики, которые еще не закреплены за преподавателем
              </CardDescription>
            </CardHeader>
            <CardContent>
              {newStudents.length > 0 ? (
                <div className="space-y-4">
                  {newStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserPlus className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{student.name}</h4>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          <Badge variant="secondary" className="mt-1">
                            Новый ученик
                          </Badge>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            onClick={() => setSelectedStudent(student)}
                            className="cursor-pointer"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Закрепить
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Закрепить ученика</DialogTitle>
                            <DialogDescription>
                              Выберите предмет для {student.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Предмет</Label>
                              <Select 
                                value={assignForm.subject}
                                onValueChange={(value) => setAssignForm({...assignForm, subject: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите предмет" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(subjects).map(([key, info]) => (
                                    <SelectItem key={key} value={key}>
                                      {info.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {userData?.role === 'admin' && (
                              <div>
                                <Label>Преподаватель</Label>
                                <Select 
                                  value={assignForm.teacherId}
                                  onValueChange={(value) => setAssignForm({...assignForm, teacherId: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите преподавателя" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {teachers.map((teacher) => (
                                      <SelectItem key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            <Button 
                              onClick={() => assignStudent(student.id)}
                              disabled={loading || !assignForm.subject}
                              className="w-full cursor-pointer"
                            >
                              {loading ? 'Закрепление...' : 'Закрепить ученика'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Новых учеников нет</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance">
          <Card>
            <CardHeader>
              <CardTitle>Управление балансом</CardTitle>
              <CardDescription>
                Начисление и списание уроков ученикам
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={updateBalance} className="space-y-4">
                <div>
                  <Label htmlFor="student-select">Ученик</Label>
                  <Select 
                    value={balanceForm.studentId} 
                    onValueChange={(value) => setBalanceForm({...balanceForm, studentId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите ученика" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} (баланс: {student.balance || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="operation">Операция</Label>
                  <Select 
                    value={balanceForm.operation} 
                    onValueChange={(value) => setBalanceForm({...balanceForm, operation: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">Добавить уроки</SelectItem>
                      <SelectItem value="set">Установить баланс</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Количество уроков</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    value={balanceForm.amount}
                    onChange={(e) => setBalanceForm({...balanceForm, amount: parseInt(e.target.value) || 0})}
                    placeholder="Введите количество уроков"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !balanceForm.studentId} 
                  className="w-full cursor-pointer"
                >
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  {loading ? 'Обновление...' : 'Обновить баланс'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}