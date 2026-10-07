import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RoomList from './pages/RoomList'
import RoomDetail from './pages/RoomDetail'
import BookingForm from './pages/BookingForm'
import MyBookings from './pages/MyBookings'
import PendingApprovals from './pages/PendingApprovals'
import RoomManagement from './pages/RoomManagement'
import Statistics from './pages/Statistics'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
  return user ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
  if (!user) return <Navigate to="/login" />
  if (!isAdmin) return <Navigate to="/" />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="rooms" element={<RoomList />} />
          <Route path="rooms/:id" element={<RoomDetail />} />
          <Route path="booking/new" element={<BookingForm />} />
          <Route path="my-bookings" element={<MyBookings />} />
          <Route path="admin/approvals" element={<AdminRoute><PendingApprovals /></AdminRoute>} />
          <Route path="admin/rooms" element={<AdminRoute><RoomManagement /></AdminRoute>} />
          <Route path="admin/stats" element={<AdminRoute><Statistics /></AdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  )
}
