import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';
import './register.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, error: authError } = useAuth();
  const [form, setForm] = useState({ 
    username: '', 
    password: '', 
    confirmPassword: '',
    role: 'SUPPLIER' as UserRole
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('Register component - isAuthenticated changed to:', isAuthenticated);
    if (isAuthenticated) {
      console.log('User is authenticated, redirecting to home page');
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Validation
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Attempting to register with data:', {
        username: form.username,
        role: form.role,
        hasImage: !!profileImage
      });
      
      await register({
        username: form.username,
        password: form.password,
        role: form.role
      }, profileImage || undefined);
      
      console.log('Registration successful, should redirect to home');
      // Navigation happens in useEffect when isAuthenticated changes
    } catch (err) {
      console.error('Registration error in component:', err);
      setError(authError || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-header">
          <h1 className="auth-title">Smart Inventory</h1>
          <h2 className="auth-subtitle">Create an account</h2>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={form.username}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your password"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              className="form-input"
              placeholder="Confirm your password"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="form-select"
              disabled
            >
              <option value="SUPPLIER">Supplier</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="profileImage">Profile Image</label>
            <div className="profile-image-upload">
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Profile Preview" className="preview-image" />
                </div>
              )}
              <input
                id="profileImage"
                name="profileImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="form-input file-input"
              />
            </div>
          </div>

          {error && (
            <div className="form-error">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`auth-button ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? 'Creating account...' : 'Sign up'}
          </button>
          
          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </div>
        </form>
      </div>
      
      <div className="auth-image">
        <div className="auth-overlay">
          <div className="auth-tagline">
            <h2>Welcome to Smart Inventory</h2>
            <p>Streamline your inventory management with our powerful tools</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
