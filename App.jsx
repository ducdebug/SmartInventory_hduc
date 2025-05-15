import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth'; 
import { ProfileImageProvider } from './context/ProfileImageContext';
import AppContent from './AppContent';

function App() {
  return (
    <ProfileImageProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ProfileImageProvider>
  );
}

export default App;