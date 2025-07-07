import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/home/home';
import SectionsPage from './pages/sections/sections';
import SectionDetail from './pages/sectiondetail/sectiondetail';
import ShelfDetail from './pages/shelfdetail/shelfdetail';
import Login from './pages/login/login';
import Register from './pages/register/register';
import { AuthProvider } from './hooks/useAuth'; 
import { ProfileImageProvider } from './context/ProfileImageContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/layout/navbar/navbar';
import Footer from './components/layout/footer/Footer';
import { 
  PrivateRoute, 
  AdminRoute, 
  SupplierRoute, 
  SupplierTemporaryRoute 
} from "./components/routes";
import LotHistoryPage from './pages/lothistory/LotHistoryPage';
import BuyerDashboard from './pages/buyerdashboard/BuyerDashboard';

import UserManagement from './pages/user-management/user-management';
import ExportManagementPage from './pages/export-management/ExportManagementPage';
import History from './pages/history/History';
import ProfilePage from './pages/profile/ProfilePage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import AdminInventoryPage from './pages/inventory/AdminInventoryPage';
import SupplierInventoryPage from './pages/supplier/SupplierInventoryPage';
import MessagePage from './pages/messaging/MessagePage';
import ChatBubbleWrapper from './components/chat/ChatBubbleWrapper';
import TemporaryUserManagement from './pages/temporary-user-management/TemporaryUserManagement';

function AppContent() {
  const location = useLocation();
  const hideFooter = location.pathname === "/login" || location.pathname === "/register";
  
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <AdminRoute>
              <Home />
            </AdminRoute>
          } />
          
          <Route path="/history" element={
            <PrivateRoute>
              <History />
            </PrivateRoute>
          } />
          
          <Route path="/unauthorized" element={
            <PrivateRoute>
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>Access Denied</h2>
                <p>You don't have permission to access this page.</p>
                <p>Please contact your administrator if you believe this is an error.</p>
              </div>
            </PrivateRoute>
          } />
          
          <Route path="/sections" element={
            <AdminRoute>
              <SectionsPage />
            </AdminRoute>
          } />
          
          <Route path="/sections/:sectionId" element={
            <AdminRoute>
              <SectionDetail />
            </AdminRoute>
          } />
          
          <Route path="/shelves/:shelfId" element={
            <AdminRoute>
              <ShelfDetail />
            </AdminRoute>
          } />
          
          <Route path='/lot-history' element={
            <PrivateRoute>
              <LotHistoryPage />
            </PrivateRoute>
          } />

          <Route path='/buyer-dashboard' element={
            <SupplierTemporaryRoute>
              <BuyerDashboard />
            </SupplierTemporaryRoute>
          } />
          
          <Route path='/profile' element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          } />
          
          <Route path='/notifications' element={
            <PrivateRoute>
              <NotificationsPage />
            </PrivateRoute>
          } />
          
          <Route path='/user-management' element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          } />
          
          <Route path='/export-management' element={
            <AdminRoute>
              <ExportManagementPage />
            </AdminRoute>
          } />
          
          <Route path='/inventory-admin' element={
            <AdminRoute>
              <AdminInventoryPage />
            </AdminRoute>
          } />
          
          <Route path='/inventory-supplier' element={
            <SupplierRoute>
              <SupplierInventoryPage />
            </SupplierRoute>
          } />
          
          <Route path='/messaging' element={
            <AdminRoute>
              <MessagePage />
            </AdminRoute>
          } />
          
          <Route path='/temporary-users' element={
            <SupplierRoute>
              <TemporaryUserManagement />
            </SupplierRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
      <ChatBubbleWrapper />
    </div>
  );
}

function App() {
  return (
    <ProfileImageProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ProfileImageProvider>
  );
}

export default App;