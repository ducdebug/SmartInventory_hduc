import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home/home';
import SectionDetail from './pages/sectiondetail/sectiondetail';
import ShelfDetail from './pages/shelfdetail/shelfdetail';
import Login from './pages/login/login';
import Register from './pages/register/register';
import { AuthProvider } from './hooks/useAuth'; 
import Navbar from './components/layout/navbar/navbar';
import PrivateRoute from "./components/privateroute";
import LotHistoryPage from './pages/lothistory/LotHistoryPage';
import RetrieveProductPage from './pages/retrieveproductpage/RetrieveProductPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
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
          
          <Route path="/sections/:sectionId" element={
            <PrivateRoute>
              <SectionDetail />
            </PrivateRoute>
          } />
          
          <Route path="/shelves/:shelfId" element={
            <PrivateRoute>
              <ShelfDetail />
            </PrivateRoute>
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
          
          {/* Redirect any unknown paths to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
