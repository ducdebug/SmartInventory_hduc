import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useProfileImage } from '../../../context/ProfileImageContext';
import { getImageDisplayUrl } from '../../../services/userService';
import BatchCreateModal from '../../batchcreatemodal/batchcreatemodal';
import NotificationDropdown from '../../notification/NotificationDropdown';
import './navbar.css';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { profileImageUrl } = useProfileImage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  const currentDisplayImageUrl = React.useMemo(() => {
    if (!isAuthenticated) return null;
    return profileImageUrl || (user?.img_url ? user.img_url : null);
  }, [profileImageUrl, user, isAuthenticated]);

  const getHomeLink = () => {
    if (user?.role === 'ADMIN') {
      return '/';
    } else if (user?.role === 'SUPPLIER' || user?.role === 'TEMPORARY') {
      return '/buyer-dashboard';
    }
    return '/history'; // fallback for any other authenticated user
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (['/login', '/register'].includes(location.pathname)) return null;

  if (!isAuthenticated && location.pathname !== '/login' && location.pathname !== '/register') {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      navigate('/login');
    } catch (error) {
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`} aria-label="Main Navigation">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to={getHomeLink()} className="navbar-brand">
            <img src="/logo.png" alt="Smart Warehouse Logo" className="logo-icon logo-white" width="28" height="28" />
            <span className="brand-text">Smart Warehouse</span>
          </Link>

          <button
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className="menu-icon">
              <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}></span>
            </span>
          </button>
        </div>

        <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
          {user?.role === 'ADMIN' && (
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Dashboard</span>
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link to="/messaging" className={location.pathname === '/messaging' ? 'active' : ''}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.418 16.97 20 12 20C10.5286 20 9.14629 19.7004 7.94309 19.1699C7.61383 19.0498 7.45008 18.9896 7.31062 18.9669C7.17118 18.9442 7.04834 18.9496 6.81583 18.9605C6.58332 18.9713 6.39145 19.0134 6.00771 19.0977L3 19.7747C2.69623 19.8356 2.54434 19.866 2.42045 19.8157C2.31213 19.7716 2.22838 19.6878 2.18428 19.5795C2.13396 19.4556 2.1644 19.3037 2.22527 19.0002L2.90238 16.0343C2.98668 15.6514 3.02883 15.4599 3.03966 15.2283C3.0504 15.0006 3.0276 14.8786 2.97463 14.7405C2.9217 14.6024 2.83156 14.4402 2.65128 14.116C2.23289 13.3525 2 12.5037 2 11.609C2 7.55001 6.02944 4.27001 11 4.02001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Messages</span>
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link to="/sections" className={location.pathname === '/sections' ? 'active' : ''}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7L12 3L4 7M20 7V17L12 21M20 7L12 11M12 21L4 17V7M12 21V11M4 7L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Sections</span>
            </Link>
          )}

          {user?.role === 'SUPPLIER' && (
            <>
              <Link to="/buyer-dashboard" className={location.pathname === '/buyer-dashboard' ? 'active' : ''}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1046 17.8954 19 19 19C20.1046 19 21 18.1046 21 17C21 15.8954 20.1046 15 19 15C17.8954 15 17 15.8954 17 17ZM9 19C10.1046 19 11 18.1046 11 17C11 15.8954 10.1046 15 9 15C7.89543 15 7 15.8954 7 17C7 18.1046 7.89543 19 9 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Product Catalog</span>
              </Link>
              <Link to="/temporary-users" className={location.pathname === '/temporary-users' ? 'active' : ''}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 8V14M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Temporary Users</span>
              </Link>
              <Link to="/history" className={location.pathname === '/history' ? 'active' : ''}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Request History</span>
              </Link>
              <button onClick={() => setIsBatchModalOpen(true)} className="new-batch-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>New Batch</span>
              </button>
            </>
          )}

          {user?.role === 'TEMPORARY' && (
            <Link to="/buyer-dashboard" className={location.pathname === '/buyer-dashboard' ? 'active' : ''}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1046 17.8954 19 19 19C20.1046 19 21 18.1046 21 17C21 15.8954 20.1046 15 19 15C17.8954 15 17 15.8954 17 17ZM9 19C10.1046 19 11 18.1046 11 17C11 15.8954 10.1046 15 9 15C7.89543 15 7 15.8954 7 17C7 18.1046 7.89543 19 9 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Product Catalog</span>
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <>
             <Link to="/lot-history" className={location.pathname === '/lot-history' ? 'active' : ''}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>Lot Management</span>
                        </Link>
              <Link to="/export-management" className={location.pathname === '/export-management' ? 'active' : ''}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 7V3M14 3H18M14 3L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Export Management</span>
              </Link>
              <Link to="/inventory-admin" className={location.pathname === '/inventory-admin' ? 'active' : ''}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5H7C5.89543 5 5 5.89543 5 7V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12H15M9 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Inventory Overview</span>
              </Link>
              <Link to="/user-management" className={location.pathname === '/user-management' ? 'active' : ''}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>User Management</span>
              </Link>
            </>
          )}


        </div>

        <div className="navbar-right">
          {isAuthenticated ? (
            <>
              <div className="notifications">
                <NotificationDropdown />
              </div>

              <div className="user-profile" ref={userMenuRef}>
                <div
                  className="user-profile-trigger"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={isUserMenuOpen}
                  aria-label="User menu"
                >
                  <div className="avatar-container">
                    {currentDisplayImageUrl && isAuthenticated ? (
                      <img
                        src={getImageDisplayUrl(currentDisplayImageUrl)}
                        alt={user?.username || 'User'}
                        className="avatar-image"
                      />
                    ) : (
                      <div className="avatar">{user?.username?.charAt(0)?.toUpperCase() || '?'}</div>
                    )}
                    <span className="user-status online"></span>
                  </div>
                </div>

                {isUserMenuOpen && (
                  <div className="user-menu">
                    <Link to="/profile" className="profile-btn" onClick={() => setIsUserMenuOpen(false)}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.7 6.3C15.7 8.23 14.13 9.8 12.2 9.8C10.27 9.8 8.7 8.23 8.7 6.3C8.7 4.37 10.27 2.8 12.2 2.8C14.13 2.8 15.7 4.37 15.7 6.3Z" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12.2 12.8C8.7 12.8 5.7 15.35 5.2 18.8H19.2C18.7 15.3 15.7 12.8 12.2 12.8Z" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Profile</span>
                    </Link>
                    <button className="logout-btn" onClick={handleLogout}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H15" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 16L14 12M14 12L10 8M14 12H4" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="login-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15M10 17L15 12M15 12L10 7M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>

      <BatchCreateModal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} />
    </nav>
  );
};

export default Navbar;