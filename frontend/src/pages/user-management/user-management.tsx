import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import './user-management.css';

interface User {
  id: string;
  username: string;
  role: string;
  enabled: boolean;
  deleted: boolean;
}

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setError('Unauthorized: Admin access required');
      setLoading(false);
      return;
    }

    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/api/admin/users/${userId}/block`,
        { blocked: !currentlyBlocked },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      fetchUsers();
    } catch (err) {
      console.error('Error toggling user block status:', err);
      setError('Failed to update user status');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const restoreUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/api/admin/users/${userId}/restore`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      fetchUsers(); // Refresh user list
    } catch (err) {
      console.error('Error restoring user:', err);
      setError('Failed to restore user');
    }
  };

  if (loading) {
    return <div className="user-management-container loading">Loading users...</div>;
  }

  if (error) {
    return <div className="user-management-container error">{error}</div>;
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h1>User Management</h1>
        <button className="refresh-button" onClick={fetchUsers}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4V8M20 8H16M20 8C17.7909 8 15.7183 8.84597 14.1213 10.3265C12.5243 11.8071 11.4648 13.8565 11.0797 16.1232M4 20V16M4 16H8M4 16C6.2091 16 8.28168 15.154 9.87868 13.6735C11.4757 12.1929 12.5352 10.1435 12.9203 7.87683" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Refresh
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="no-users">No users found</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className={user.deleted ? 'deleted-user' : ''}>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>
                    {user.deleted ? (
                      <span className="status deleted">Deleted</span>
                    ) : user.enabled ? (
                      <span className="status active">Active</span>
                    ) : (
                      <span className="status blocked">Blocked</span>
                    )}
                  </td>
                  <td className="actions">
                    {!user.deleted && (
                      <button 
                        className={`block-button ${!user.enabled ? 'unblock' : 'block'}`}
                        onClick={() => toggleBlockUser(user.id, !user.enabled)}
                      >
                        {!user.enabled ? 'Unblock' : 'Block'}
                      </button>
                    )}
                    
                    {!user.deleted ? (
                      <button 
                        className="delete-button"
                        onClick={() => deleteUser(user.id)}
                      >
                        Delete
                      </button>
                    ) : (
                      <button 
                        className="restore-button"
                        onClick={() => restoreUser(user.id)}
                      >
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;