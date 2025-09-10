import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))

app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Auth routes
// Регистрация новых пользователей (только ученики)
// Административные аккаунты создаются напрямую через Supabase Admin API:
// 1. Создать пользователя через supabase.auth.admin.createUser()
// 2. Добавить запись в KV store: kv.set(`user:${userId}`, { id, email, name, role: 'admin', ... })
app.post('/make-server-fc610ba0/auth/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json()
    // Все новые пользователи автоматически получают роль ученика
    const role = 'student'
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true
    })
    
    if (error) {
      console.log('Signup error:', error)
      return c.json({ error: error.message }, 400)
    }
    
    // Store user data in KV
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role,
      balance: role === 'student' ? 0 : null,
      teacher: null, // ID учителя для учеников
      subject: null, // Предмет: 'frontend', 'python', '3d_modeling'
      createdAt: new Date().toISOString()
    })
    
    return c.json({ user: data.user })
  } catch (error) {
    console.log('Signup error:', error)
    return c.json({ error: 'Failed to create user' }, 500)
  }
})

app.post('/make-server-fc610ba0/auth/signin', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.log('Signin error:', error)
      return c.json({ error: error.message }, 400)
    }
    
    return c.json(data)
  } catch (error) {
    console.log('Signin error:', error)
    return c.json({ error: 'Failed to sign in' }, 500)
  }
})

// Get current user data
app.get('/make-server-fc610ba0/user/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const userData = await kv.get(`user:${user.id}`)
    return c.json({ user: userData || user })
  } catch (error) {
    console.log('Profile error:', error)
    return c.json({ error: 'Failed to get profile' }, 500)
  }
})

// Get students based on role
app.get('/make-server-fc610ba0/students', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const currentUser = await kv.get(`user:${user.id}`)
    if (!currentUser || !['admin', 'teacher'].includes(currentUser.role)) {
      return c.json({ error: 'Teacher or admin access required' }, 403)
    }
    
    const users = await kv.getByPrefix('user:')
    const allStudents = users.filter(u => u.role === 'student')
    const allTeachers = users.filter(u => u.role === 'teacher' || u.role === 'admin')
    
    // Добавляем информацию о преподавателях к ученикам
    const studentsWithTeachers = allStudents.map(student => {
      const teacher = allTeachers.find(t => t.id === student.teacher)
      return {
        ...student,
        teacherName: teacher?.name || null
      }
    })
    
    let students, newStudents = []
    
    if (currentUser.role === 'admin') {
      // Админ видит всех учеников
      students = studentsWithTeachers
      newStudents = studentsWithTeachers.filter(s => !s.teacher)
    } else if (currentUser.role === 'teacher') {
      // Учитель видит только своих учеников и новых
      students = studentsWithTeachers.filter(s => s.teacher === user.id)
      newStudents = studentsWithTeachers.filter(s => !s.teacher)
    }
    
    return c.json({ students, newStudents })
  } catch (error) {
    console.log('Students fetch error:', error)
    return c.json({ error: 'Failed to fetch students' }, 500)
  }
})

// Assign student to teacher with subject
app.post('/make-server-fc610ba0/students/:studentId/assign', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const currentUser = await kv.get(`user:${user.id}`)
    if (!currentUser || !['admin', 'teacher'].includes(currentUser.role)) {
      return c.json({ error: 'Teacher or admin access required' }, 403)
    }
    
    const studentId = c.req.param('studentId')
    const { teacherId, subject } = await c.req.json()
    
    // Валидация предмета
    const validSubjects = ['frontend', 'python', '3d_modeling']
    if (!validSubjects.includes(subject)) {
      return c.json({ error: 'Invalid subject' }, 400)
    }
    
    const student = await kv.get(`user:${studentId}`)
    if (!student || student.role !== 'student') {
      return c.json({ error: 'Student not found' }, 404)
    }
    
    // Если учитель назначает себя, используем его ID, иначе переданный teacherId (для админа)
    const finalTeacherId = currentUser.role === 'teacher' ? user.id : (teacherId || user.id)
    
    await kv.set(`user:${studentId}`, {
      ...student,
      teacher: finalTeacherId,
      subject
    })
    
    return c.json({ success: true, student: { ...student, teacher: finalTeacherId, subject } })
  } catch (error) {
    console.log('Student assignment error:', error)
    return c.json({ error: 'Failed to assign student' }, 500)
  }
})

// Change student's teacher (admin only)
app.post('/make-server-fc610ba0/students/:studentId/change-teacher', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const currentUser = await kv.get(`user:${user.id}`)
    if (!currentUser || currentUser.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403)
    }
    
    const studentId = c.req.param('studentId')
    const { teacherId, subject } = await c.req.json()
    
    const student = await kv.get(`user:${studentId}`)
    if (!student || student.role !== 'student') {
      return c.json({ error: 'Student not found' }, 404)
    }
    
    // Валидация предмета
    const validSubjects = ['frontend', 'python', '3d_modeling']
    if (!validSubjects.includes(subject)) {
      return c.json({ error: 'Invalid subject' }, 400)
    }
    
    await kv.set(`user:${studentId}`, {
      ...student,
      teacher: teacherId,
      subject
    })
    
    return c.json({ success: true, student: { ...student, teacher: teacherId, subject } })
  } catch (error) {
    console.log('Teacher change error:', error)
    return c.json({ error: 'Failed to change teacher' }, 500)
  }
})

// Get all teachers (admin only)
app.get('/make-server-fc610ba0/teachers', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const currentUser = await kv.get(`user:${user.id}`)
    if (!currentUser || currentUser.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403)
    }
    
    const users = await kv.getByPrefix('user:')
    const teachers = users.filter(u => u.role === 'teacher' || u.role === 'admin')
    
    return c.json({ teachers })
  } catch (error) {
    console.log('Teachers fetch error:', error)
    return c.json({ error: 'Failed to fetch teachers' }, 500)
  }
})

// Update student balance (admin and teacher)
app.post('/make-server-fc610ba0/students/:studentId/balance', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const currentUser = await kv.get(`user:${user.id}`)
    if (!currentUser || !['admin', 'teacher'].includes(currentUser.role)) {
      return c.json({ error: 'Teacher or admin access required' }, 403)
    }
    
    const studentId = c.req.param('studentId')
    const { amount, operation } = await c.req.json()
    
    const student = await kv.get(`user:${studentId}`)
    if (!student || student.role !== 'student') {
      return c.json({ error: 'Student not found' }, 404)
    }
    
    // Учитель может управлять балансом только своих учеников
    if (currentUser.role === 'teacher' && student.teacher !== user.id) {
      return c.json({ error: 'Access denied - not your student' }, 403)
    }
    
    const newBalance = operation === 'add' 
      ? (student.balance || 0) + amount 
      : amount
    
    await kv.set(`user:${studentId}`, {
      ...student,
      balance: newBalance
    })
    
    // Log balance change
    await kv.set(`balance_log:${studentId}:${Date.now()}`, {
      studentId,
      operation,
      amount,
      previousBalance: student.balance || 0,
      newBalance,
      timestamp: new Date().toISOString(),
      adminId: user.id
    })
    
    return c.json({ balance: newBalance })
  } catch (error) {
    console.log('Balance update error:', error)
    return c.json({ error: 'Failed to update balance' }, 500)
  }
})

// Lessons management
app.get('/make-server-fc610ba0/lessons', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const currentUser = await kv.get(`user:${user.id}`)
    let lessons
    
    if (currentUser.role === 'admin') {
      // Админ видит все уроки
      lessons = await kv.getByPrefix('lesson:')
    } else if (currentUser.role === 'teacher') {
      // Учитель видит только свои уроки
      const allLessons = await kv.getByPrefix('lesson:')
      lessons = allLessons.filter(lesson => lesson.teacherId === user.id)
    } else {
      // Ученик видит только свои уроки
      lessons = await kv.getByPrefix(`lesson:${user.id}:`)
    }
    
    return c.json({ lessons })
  } catch (error) {
    console.log('Lessons fetch error:', error)
    return c.json({ error: 'Failed to fetch lessons' }, 500)
  }
})

app.post('/make-server-fc610ba0/lessons', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { title, date, time, studentId, description } = await c.req.json()
    const lessonId = `${Date.now()}`
    
    const lesson = {
      id: lessonId,
      title,
      date,
      time,
      studentId: studentId || user.id,
      teacherId: user.id,
      description,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`lesson:${lesson.studentId}:${lessonId}`, lesson)
    
    return c.json({ lesson })
  } catch (error) {
    console.log('Lesson creation error:', error)
    return c.json({ error: 'Failed to create lesson' }, 500)
  }
})

// Update lesson
app.put('/make-server-fc610ba0/lessons/:lessonId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const currentUser = await kv.get(`user:${user.id}`)
    if (!currentUser || !['admin', 'teacher'].includes(currentUser.role)) {
      return c.json({ error: 'Teacher or admin access required' }, 403)
    }
    
    const lessonId = c.req.param('lessonId')
    const { title, date, time, studentId, description, status } = await c.req.json()
    
    const lessons = await kv.getByPrefix('lesson:')
    const lesson = lessons.find(l => l.id === lessonId)
    
    if (!lesson) {
      return c.json({ error: 'Lesson not found' }, 404)
    }
    
    // Учитель может редактировать только свои уроки
    if (currentUser.role === 'teacher' && lesson.teacherId !== user.id) {
      return c.json({ error: 'Access denied - not your lesson' }, 403)
    }
    
    const updatedLesson = {
      ...lesson,
      title: title || lesson.title,
      date: date || lesson.date,
      time: time || lesson.time,
      studentId: studentId || lesson.studentId,
      description: description !== undefined ? description : lesson.description,
      status: status || lesson.status,
      updatedAt: new Date().toISOString()
    }
    
    // Удаляем старую запись если изменился студент
    if (lesson.studentId !== updatedLesson.studentId) {
      await kv.del(`lesson:${lesson.studentId}:${lessonId}`)
    }
    
    await kv.set(`lesson:${updatedLesson.studentId}:${lessonId}`, updatedLesson)
    
    return c.json({ lesson: updatedLesson })
  } catch (error) {
    console.log('Lesson update error:', error)
    return c.json({ error: 'Failed to update lesson' }, 500)
  }
})

app.delete('/make-server-fc610ba0/lessons/:lessonId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const currentUser = await kv.get(`user:${user.id}`)
    if (!currentUser || !['admin', 'teacher'].includes(currentUser.role)) {
      return c.json({ error: 'Teacher or admin access required' }, 403)
    }
    
    const lessonId = c.req.param('lessonId')
    const lessons = await kv.getByPrefix('lesson:')
    const lesson = lessons.find(l => l.id === lessonId)
    
    if (!lesson) {
      return c.json({ error: 'Lesson not found' }, 404)
    }
    
    // Учитель может удалять только свои уроки
    if (currentUser.role === 'teacher' && lesson.teacherId !== user.id) {
      return c.json({ error: 'Access denied - not your lesson' }, 403)
    }
    
    await kv.del(`lesson:${lesson.studentId}:${lessonId}`)
    return c.json({ success: true })
  } catch (error) {
    console.log('Lesson deletion error:', error)
    return c.json({ error: 'Failed to delete lesson' }, 500)
  }
})

Deno.serve(app.fetch)