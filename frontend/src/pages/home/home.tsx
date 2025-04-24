import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import './home.css';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="home-wrapper">
      <main className="home-main">
        <div className="home-header">
          <h1 className="home-title">Welcome to Smart Inventory</h1>
        </div>
        <div className="home-content">
          <p>This page will be redesigned later.</p>
          {user?.role === 'BUYER' && (
            <p>Please check the History page to view your dispatches.</p>
          )}
          {user?.role === 'ADMIN' && (
            <p>Please navigate to the Sections page to manage warehouse sections.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;