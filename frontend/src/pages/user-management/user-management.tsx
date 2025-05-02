import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../config';
import { getAuthToken } from '../../services/authService';
import { getImageDisplayUrl } from '../../services/userService';
import './user-management.css';

interface User {
  id: string;
  username: string;
  role: string;
  enabled: boolean;
  deleted: boolean;
  img_url?: string;
}

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setError('Unauthorized: Admin access required');
      setLoading(false);
      return;
    }

    fetchUsers();
  }, [user]);

  useEffect(() => {
    // Apply filters and search whenever they change
    filterUsers();
  }, [users, searchQuery, statusFilter, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
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

  const filterUsers = () => {
    let result = [...users];
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(user => 
        user.username.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        result = result.filter(user => user.enabled && !user.deleted);
      } else if (statusFilter === 'blocked') {
        result = result.filter(user => !user.enabled && !user.deleted);
      } else if (statusFilter === 'deleted') {
        result = result.filter(user => user.deleted);
      }
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(result);
  };

  const toggleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    try {
      const token = getAuthToken();
      await axios.put(
        `${API_BASE_URL}/admin/users/${userId}/block`,
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
      const token = getAuthToken();
      await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, {
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
      const token = getAuthToken();
      await axios.put(
        `${API_BASE_URL}/admin/users/${userId}/restore`,
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
  };

  // Get unique roles from users for the filter dropdown
  const uniqueRoles = Array.from(new Set(users.map(user => user.role)));

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

      <div className="user-filters">
        <div className="search-container">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search users..." 
            className="search-input"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="filter-container">
          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select 
              id="status-filter" 
              value={statusFilter} 
              onChange={handleStatusFilterChange}
              className="filter-select"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="role-filter">Role:</label>
            <select 
              id="role-filter" 
              value={roleFilter} 
              onChange={handleRoleFilterChange}
              className="filter-select"
            >
              <option value="all">All</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
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
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="no-users">
                  {users.length === 0 ? 'No users found' : 'No users match your filters'}
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className={user.deleted ? 'deleted-user' : ''}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.img_url ? (
                          <img 
                            src={getImageDisplayUrl(user.img_url)} 
                            alt={user.username}
                            className="avatar-image"
                          />
                        ) : (
                          <div className="avatar">{user.username.charAt(0).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="user-management-username">{user.username}</div>
                    </div>
                  </td>
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