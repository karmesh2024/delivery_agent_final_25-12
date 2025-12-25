import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  fetchTemporaryPermissions,
  fetchPermissionRequests,
  fetchNotifications,
  fetchStats,
  createPermissionRequest,
  approveRequest,
  rejectRequest,
  markNotificationAsRead,
  clearError
} from '../store/slices/permissionsSlice'

const PermissionsManagement: React.FC = () => {
  const dispatch = useAppDispatch()
  const { 
    temporaryPermissions, 
    permissionRequests, 
    notifications, 
    stats, 
    loading, 
    error 
  } = useAppSelector(state => state.permissions)

  const [activeTab, setActiveTab] = useState<'permissions' | 'requests' | 'notifications'>('permissions')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestForm, setRequestForm] = useState({
    permission_id: '',
    scope_type: 'global' as 'province' | 'region' | 'city' | 'warehouse' | 'global',
    scope_id: '',
    reason: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    expires_at: ''
  })

  // Mock admin ID - في التطبيق الحقيقي سيأتي من authentication
  const adminId = 'admin-id-here'

  useEffect(() => {
    if (adminId) {
      dispatch(fetchTemporaryPermissions(adminId))
      dispatch(fetchPermissionRequests(adminId))
      dispatch(fetchNotifications(adminId))
      dispatch(fetchStats(adminId))
    }
  }, [dispatch, adminId])

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dispatch(createPermissionRequest({
        requester_id: adminId,
        ...requestForm,
        expires_at: requestForm.expires_at ? new Date(requestForm.expires_at) : undefined
      })).unwrap()
      setRequestForm({
        permission_id: '',
        scope_type: 'global',
        scope_id: '',
        reason: '',
        priority: 'medium',
        expires_at: ''
      })
      setShowRequestForm(false)
    } catch (error) {
      console.error('Error creating permission request:', error)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      await dispatch(approveRequest({
        requestId,
        approverId: adminId,
        comments: 'تمت الموافقة'
      })).unwrap()
    } catch (error) {
      console.error('Error approving request:', error)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await dispatch(rejectRequest({
        requestId,
        approverId: adminId,
        comments: 'تم الرفض'
      })).unwrap()
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await dispatch(markNotificationAsRead(notificationId)).unwrap()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            onClick={() => dispatch(clearError())}
            className="float-right text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* إحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800">الصلاحيات النشطة</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.activePermissions}</p>
        </div>
        <div className="bg-yellow-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800">طلبات في الانتظار</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingRequests}</p>
        </div>
        <div className="bg-green-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800">الإشعارات</h3>
          <p className="text-3xl font-bold text-green-600">{stats.unreadNotifications}</p>
        </div>
      </div>

      {/* التبويبات */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              الصلاحيات المؤقتة
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              طلبات الصلاحيات
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              الإشعارات
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* الصلاحيات المؤقتة */}
          {activeTab === 'permissions' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">الصلاحيات المؤقتة</h3>
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  طلب صلاحية جديدة
                </button>
              </div>

              <div className="space-y-4">
                {temporaryPermissions.map((permission) => (
                  <div key={permission.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{permission.permission?.name}</h4>
                        <p className="text-sm text-gray-600">{permission.permission?.code}</p>
                        <p className="text-sm text-gray-500">
                          النطاق: {permission.scope_type}
                        </p>
                        {permission.reason && (
                          <p className="text-sm text-gray-500">السبب: {permission.reason}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          ينتهي في: {new Date(permission.expires_at).toLocaleDateString('ar-EG')}
                        </p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          نشط
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* طلبات الصلاحيات */}
          {activeTab === 'requests' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">طلبات الصلاحيات</h3>
              <div className="space-y-4">
                {permissionRequests.map((request) => (
                  <div key={request.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{request.permission?.name}</h4>
                        <p className="text-sm text-gray-600">{request.permission?.code}</p>
                        <p className="text-sm text-gray-500">السبب: {request.reason}</p>
                        <p className="text-sm text-gray-500">
                          الأولوية: {request.priority}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'pending' ? 'في الانتظار' :
                           request.status === 'approved' ? 'موافق عليه' : 'مرفوض'}
                        </span>
                        {request.status === 'pending' && (
                          <div className="mt-2 space-x-2">
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                              موافقة
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            >
                              رفض
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* الإشعارات */}
          {activeTab === 'notifications' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">الإشعارات</h3>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`rounded-lg p-4 ${
                      notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{notification.title}</h4>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          تم القراءة
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* نموذج طلب الصلاحية */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">طلب صلاحية جديدة</h3>
            <form onSubmit={handleCreateRequest}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">نوع النطاق</label>
                  <select
                    value={requestForm.scope_type}
                    onChange={(e) => setRequestForm({...requestForm, scope_type: e.target.value as any})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="global">عام</option>
                    <option value="province">محافظة</option>
                    <option value="region">منطقة</option>
                    <option value="city">مدينة</option>
                    <option value="warehouse">مستودع</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">السبب</label>
                  <textarea
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm({...requestForm, reason: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">الأولوية</label>
                  <select
                    value={requestForm.priority}
                    onChange={(e) => setRequestForm({...requestForm, priority: e.target.value as any})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                    <option value="urgent">عاجلة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">تاريخ الانتهاء</label>
                  <input
                    type="datetime-local"
                    value={requestForm.expires_at}
                    onChange={(e) => setRequestForm({...requestForm, expires_at: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  إرسال الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PermissionsManagement
