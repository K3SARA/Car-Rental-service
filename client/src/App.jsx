import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VehicleList from './pages/VehicleList';
import VehicleForm from './pages/VehicleForm';
import CustomerList from './pages/CustomerList';
import CustomerForm from './pages/CustomerForm';
import BookingList from './pages/BookingList';
import BookingForm from './pages/BookingForm';
import BookingCalendar from './pages/BookingCalendar';
import BookingDetail from './pages/BookingDetail';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="vehicles" element={<VehicleList />} />
        <Route path="vehicles/new" element={<VehicleForm />} />
        <Route path="vehicles/:id/edit" element={<VehicleForm />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:id/edit" element={<CustomerForm />} />
        <Route path="bookings" element={<BookingList />} />
        <Route path="bookings/new" element={<BookingForm />} />
        <Route path="bookings/:id" element={<BookingDetail />} />
        <Route path="bookings/:id/edit" element={<BookingForm />} />
        <Route path="calendar" element={<BookingCalendar />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
