import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { ImageWithFallback } from './error/ImageWithFallback'
import { CheckCircle, Calendar, Users, BookOpen, Code, Trophy } from 'lucide-react'

interface HomePageProps {
  onLogin: () => void
}

export function HomePage({ onLogin }: HomePageProps) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-6">
              Изучение программирования<br />
              с личным наставником
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
              Индивидуальные уроки программирования для начинающих и продвинутых разработчиков.
              Гибкое расписание, персональный подход и практические проекты.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={onLogin}
              >
                Начать обучение
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              >
                Узнать больше
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mb-4">Почему выбирают нас</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Современный подход к обучению программированию с использованием передовых технологий и методик
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Индивидуальный подход</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Персональная программа обучения, адаптированная под ваши цели и уровень подготовки
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Гибкое расписание</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Выбирайте удобное время для занятий и легко управляйте своим расписанием через личный кабинет
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Code className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Практические проекты</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Изучение через создание реальных проектов - от простых алгоритмов до полноценных приложений
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technologies Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mb-4">Технологии, которые мы изучаем</h2>
            <p className="text-xl text-gray-600">
              Современный стек технологий для веб-разработки и не только
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Git', 'SQL', 'Docker', 'AWS', 'CSS', 'HTML', 'MongoDB'].map((tech) => (
              <div key={tech} className="text-center">
                <Badge variant="outline" className="px-4 py-2 text-sm">
                  {tech}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="mb-6">Что вы получите</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Структурированное обучение</h3>
                    <p className="text-gray-600">От основ до продвинутых концепций с четким планом развития</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Система баланса уроков</h3>
                    <p className="text-gray-600">Учет занятий через личный кабинет</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Интерактивный календарь</h3>
                    <p className="text-gray-600">Планирование занятий как в Google Календаре с уведомлениями</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Портфолио проектов</h3>
                    <p className="text-gray-600">Создание реальных проектов для вашего GitHub и резюме</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="text-center mb-6">
                <div className="w-32 h-32 mx-auto mb-4 rounded-lg overflow-hidden">
                  <ImageWithFallback 
                    src="https://images.unsplash.com/photo-1669023414180-4dcf35d943e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwbGVhcm5pbmclMjBjb2RlJTIwY29tcHV0ZXJ8ZW58MXx8fHwxNzU3MzI2Njg4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Студент изучает программирование"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="mb-2">Начните обучение сегодня</h3>
                <p className="text-gray-600 mb-6">
                  Присоединитесь к сообществу успешных разработчиков
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                  <span>Первый урок</span>
                  <Badge variant="secondary">знакомство с преподавателем и практика</Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                  <span>Гибкое расписание</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                  <span>Материалы курса</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
              
              <Button 
                className="w-full mt-6" 
                size="lg"
                onClick={onLogin}
              >
                Записаться на урок
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="mb-4">HM</h3>
              <p className="text-gray-400">
                Персональное обучение программированию для достижения ваших целей в IT
              </p>
            </div>
            
            <div>
              <h4 className="mb-4">Контакты</h4>
              <div className="space-y-2 text-gray-400">
                <p>Email: contact@test.ru</p>
                <p>Telegram: @test.ru</p>
                <p>WhatsApp: +7 (000) 000-00-00</p>
              </div>
            </div>
            
            <div>
              <h4 className="mb-4">Курсы</h4>
              <div className="space-y-2 text-gray-400">
                <p>JavaScript для начинающих</p>
                <p>React разработка</p>
                <p>Backend на Node.js</p>
                <p>Python программирование</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}