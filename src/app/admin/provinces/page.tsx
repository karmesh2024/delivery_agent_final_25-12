'use client'

import React, { useState } from 'react'
import { Provider } from 'react-redux'
import { store } from '../../../store'
import ProvincesManagement from '../../../components/provinces/ProvincesManagement'
import PermissionsManagement from '../../../components/PermissionsManagement'

const ProvincesPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'provinces' | 'permissions'>('provinces')

  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">نظام المحافظات والصلاحيات</h1>
                <p className="text-gray-600">إدارة شاملة للمحافظات والمناطق والصلاحيات المؤقتة</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveSection('provinces')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    activeSection === 'provinces'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  إدارة المحافظات
                </button>
                <button
                  onClick={() => setActiveSection('permissions')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    activeSection === 'permissions'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  إدارة الصلاحيات
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeSection === 'provinces' ? (
            <ProvincesManagement />
          ) : (
            <PermissionsManagement />
          )}
        </div>
      </div>
    </Provider>
  )
}

export default ProvincesPage