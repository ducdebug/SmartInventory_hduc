import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import BatchCreateModal from '../../batchcreatemodal/batchcreatemodal';
import './navbar.css';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (['/login', '/register'].includes(location.pathname)) return null;

  return (
    <nav className="custom-navbar" aria-label="Main Navigation">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">Smart Inventory</Link>
          <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="4" y1="4" x2="20" y2="20" stroke="black" strokeWidth="2" />
                <line x1="4" y1="20" x2="20" y2="4" stroke="black" strokeWidth="2" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="3" y1="6" x2="21" y2="6" stroke="black" strokeWidth="2" />
                <line x1="3" y1="12" x2="21" y2="12" stroke="black" strokeWidth="2" />
                <line x1="3" y1="18" x2="21" y2="18" stroke="black" strokeWidth="2" />
              </svg>
            )}
          </button>
        </div>

        <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
          {!isAuthenticated && (
            <>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12L12 3L21 12V21H3V12Z" stroke="black" strokeWidth="2" />
                </svg>
                Dashboard
              </Link>
              <Link to="/inventory" className={location.pathname === '/inventory' ? 'active' : ''}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" stroke="black" strokeWidth="2" />
                </svg>
                Inventory
              </Link>
              <Link to="/lot-history" className={location.pathname === '/lot-history' ? 'active' : ''}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="black" strokeWidth="2" />
                  <line x1="12" y1="6" x2="12" y2="12" stroke="black" strokeWidth="2" />
                  <line x1="12" y1="12" x2="16" y2="14" stroke="black" strokeWidth="2" />
                </svg>
                Lot History
              </Link>
              <Link to="/retrieve" className={location.pathname === '/retrieve' ? 'active' : ''}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="8" stroke="black" strokeWidth="2" />
                  <line x1="16" y1="16" x2="21" y2="21" stroke="black" strokeWidth="2" />
                </svg>
                Retrieve Product
              </Link>
              <button onClick={() => setIsBatchModalOpen(true)} className="new-batch-btn">
                + New Batch
              </button>
            </>
          )}
        </div>

        {!isAuthenticated && (
          <div className="navbar-right">
            <span className="user-info">
              {user?.username} <span className="role-tag">{user?.role}</span>
            </span>
            <button className="logout-btn" onClick={() => logout()}>
              Logout
            </button>
          </div>
        )}
      </div>

      <BatchCreateModal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} />
    </nav>
  );
};

export default Navbar;