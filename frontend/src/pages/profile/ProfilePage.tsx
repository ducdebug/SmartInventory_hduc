import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Form, Input, Row, Col, Divider, message, Alert, Typography, Upload, Avatar, Modal, Spin } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  SafetyOutlined, 
  UploadOutlined, 
  CameraOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

import userService, { UserProfile, ChangePasswordData, getImageDisplayUrl } from '../../services/userService';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { useProfileImage } from '../../context/ProfileImageContext';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordForm] = Form.useForm();
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { updateProfileImage } = useProfileImage();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const userData = await userService.getProfile();
        console.log('Profile data fetched:', userData);
        
        // Log the image URL if present
        if (userData.img_url) {
          console.log('Image URL found in profile:', 
                      userData.img_url.substring(0, 20) + 
                      (userData.img_url.length > 20 ? '...' : ''));
        } else {
          console.log('No image URL in profile');
        }
        
        setProfile(userData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to fetch profile data');
        if (err.message?.includes('401')) {
          message.error('Your session has expired. Please login again.');
          authService.logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  interface PasswordFormValues extends ChangePasswordData {
    confirmPassword: string;
  }

  const handlePasswordChange = async (values: PasswordFormValues) => {
    try {
      setPasswordLoading(true);
      console.log('Changing password...');
      
      const { confirmPassword, ...passwordData } = values;
      await userService.changePassword(passwordData);
      
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (err: any) {
      console.error('Password change error:', err);
      
      let errorMessage = 'Failed to change password';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }
      
      message.error(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('File selected:', file.name, 'type:', file.type, 'size:', file.size);
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      message.error('Please upload an image file (JPEG, PNG, GIF)');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      message.error('Image must be smaller than 2MB');
      return;
    }
    
    handleProfileImageUpdate(file);
  };
  
  const handleProfileImageUpdate = async (file: File) => {
    try {
      setImageLoading(true);
      console.log('Uploading profile image...', file.name, 'size:', file.size, 'type:', file.type);
      
      const result = await userService.updateProfileImage(file);
      console.log('Upload response:', result);
      
      if (result && result.img_url) {
        const newImgUrl = result.img_url;
        setProfile((prev: UserProfile | null) => 
          prev ? { ...prev, img_url: newImgUrl } : null
        );

        updateProfileImage(newImgUrl);
        
        message.success('Profile image updated successfully');
      } else {
        console.error('Invalid response format - missing img_url');
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Profile image update error:', err);
      message.error(err.message || 'Failed to update profile image');
    } finally {
      setImageLoading(false);
    }
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handlePreview = () => {
    if (profile?.img_url) {
      try {
        const displayUrl = getImageDisplayUrl(profile.img_url);
        setPreviewImage(displayUrl);
        setPreviewVisible(true);
      } catch (error) {
        console.error('Error setting preview image:', error);
        message.error('Failed to preview image');
      }
    }
  };

  return (
    <div className="profile-container">
      <Typography.Title level={2} className="profile-title">Your Profile</Typography.Title>
      
      {error && (
        <Alert 
          type="error" 
          message={error} 
          style={{ marginBottom: '20px', animation: 'fadeIn 0.5s ease-out' }}
          showIcon
        />
      )}
      
      {/* Enhanced Image Preview Modal */}
      <Modal
        open={previewVisible}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserOutlined style={{ color: '#1890ff' }} />
            <span>Profile Picture</span>
          </div>
        }
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>
        ]}
        onCancel={() => setPreviewVisible(false)}
        centered
        width={500}
      >
        <div style={{ 
          overflow: 'hidden', 
          borderRadius: '12px', 
          border: '1px solid #f0f0f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
          <img alt="Profile" style={{ width: '100%', display: 'block' }} src={previewImage} />
        </div>
      </Modal>
      
      <Row gutter={32} style={{ marginTop: '12px' }}>
        <Col xs={24} md={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserOutlined style={{ color: '#1890ff' }} />
                <span>User Information</span>
              </div>
            } 
            loading={loading} 
            className="profile-card responsive-card"
            bordered={false}
          >
            {profile && (
              <>
                <div className="profile-image-container">
                  {imageLoading ? (
                    <div className="avatar-placeholder">
                      <Spin size="large" />
                    </div>
                  ) : (
                    <div className="avatar-container" onClick={profile.img_url ? handlePreview : triggerFileInput}>
                      {profile.img_url ? (
                        <Avatar 
                          size={120} 
                          src={getImageDisplayUrl(profile.img_url)} 
                          className="profile-avatar"
                          alt={profile.username}
                          icon={<UserOutlined />}
                        />
                      ) : (
                        <Avatar 
                          size={120} 
                          icon={<UserOutlined />} 
                          className="profile-avatar" 
                          style={{ backgroundColor: '#1890ff' }} 
                        />
                      )}
                      <div className="avatar-upload-overlay">
                        <CameraOutlined />
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    aria-label="Upload profile picture"
                  />
                  <Button 
                    icon={<UploadOutlined />} 
                    onClick={triggerFileInput}
                    className="upload-button"
                    disabled={imageLoading}
                  >
                    {profile.img_url ? 'Change Picture' : 'Upload Picture'}
                  </Button>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Username:</span>
                  <span className="info-value">{profile.username}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Role:</span>
                  <span className="role-badge">{profile.role}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  {profile.enabled ? (
                    <span className="status-active">
                      <CheckCircleOutlined /> Active
                    </span>
                  ) : (
                    <span className="status-inactive">
                      <CloseCircleOutlined /> Disabled
                    </span>
                  )}
                </div>
              </>
            )}
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LockOutlined style={{ color: '#1890ff' }} />
                <span>Change Password</span>
              </div>
            } 
            className="profile-card responsive-card"
            bordered={false}
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
              className="password-form"
            >
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: true, message: 'Please enter your current password' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Enter current password" />
              </Form.Item>
              
              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'Please enter your new password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password prefix={<SafetyOutlined />} placeholder="Enter new password" />
              </Form.Item>
              
              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your new password' },
                  ({ getFieldValue }: { getFieldValue: (name: string) => string }) => ({
                    validator(_: unknown, value: string) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<SafetyOutlined />} placeholder="Confirm new password" />
              </Form.Item>
              
              <Form.Item className="form-actions">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={passwordLoading} 
                  size="large"
                >
                  {passwordLoading ? 'Changing Password...' : 'Change Password'}
                </Button>
                <div className="form-hint">
                  Make sure your new password is secure and contains a mix of letters, numbers, and special characters.
                </div>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage;