import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/home/home';
import SectionDetail from './pages/sectiondetail/sectiondetail';
import ShelfDetail from './pages/shelfdetail/shelfdetail';
import Login from './pages/login/login';
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
          <Route
          path="/"
          element={
              <Home />
          }
        />
          <Route path="/login" element={<Login />} />
          <Route path="/sections/:sectionId" element={<SectionDetail />} />
          <Route path="/shelves/:shelfId" element={<ShelfDetail />} />
          <Route path='/lot-history' element={<LotHistoryPage />} />
          <Route path='/retrieve' element={<RetrieveProductPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}


export default App;
