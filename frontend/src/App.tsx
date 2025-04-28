import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home/home';
import SectionsPage from './pages/sections/sections';
import SectionDetail from './pages/sectiondetail/sectiondetail';
import ShelfDetail from './pages/shelfdetail/shelfdetail';
import Login from './pages/login/login';
import Register from './pages/register/register';
import { AuthProvider } from './hooks/useAuth'; 
import Navbar from './components/layout/navbar/navbar';
import Footer from './components/layout/footer/Footer';
import PrivateRoute from "./components/privateroute";
import AdminRoute from "./components/adminroute";
import LotHistoryPage from './pages/lothistory/LotHistoryPage';
import RetrieveProductPage from './pages/retrieveproductpage/RetrieveProductPage';
import DashboardPage from './pages/dashboard/dashboard';
import UserManagement from './pages/user-management/user-management';
import ExportManagementPage from './pages/export-management/ExportManagementPage';
import History from './pages/history/History';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              } />
              
              {/* Buyer-specific routes */}
              <Route path="/history" element={
                <PrivateRoute>
                  <History />
                </PrivateRoute>
              } />
              
              {/* Section routes - now admin only */}
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
              
              <Route path='/retrieve' element={
                <PrivateRoute>
                  <RetrieveProductPage />
                </PrivateRoute>
              } />
              
              <Route path='/dashboard' element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              } />
              
              <Route path='/profile' element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              } />
              
              {/* Admin-only routes */}
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
              
              {/* Redirect any unknown paths to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;