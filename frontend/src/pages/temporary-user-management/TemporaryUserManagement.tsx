import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Input, message, Space, Tag, Popconfirm, Typography } from 'antd';
import { PlusOutlined, UserAddOutlined, CopyOutlined, SyncOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import dispatchService, { CreateTemporaryUserRequest, TemporaryUserResponse, TemporaryUser } from '../../services/dispatchService';
import './TemporaryUserManagement.css';

const { Title, Text } = Typography;

const TemporaryUserManagement: React.FC = () => {
  const { user } = useAuth();
  const [temporaryUsers, setTemporaryUsers] = useState<TemporaryUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [createdUser, setCreatedUser] = useState<TemporaryUserResponse | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTemporaryUsers();
  }, []);

  if (user?.role !== 'SUPPLIER') {
    return (
      <Card style={{ margin: '20px' }}>
        <Text type="danger">
          You do not have permission to access this page. This page is only accessible to suppliers.
        </Text>
      </Card>
    );
  }

  const fetchTemporaryUsers = async () => {
    try {
      setLoading(true);
      const users = await dispatchService.getTemporaryUsers();
      setTemporaryUsers(users.filter((user: TemporaryUser) => user.role === 'TEMPORARY'));
    } catch (error) {
      message.error('Failed to load temporary users');
      console.error('Error fetching temporary users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (values: CreateTemporaryUserRequest) => {
    try {
      setLoading(true);
      const result = await dispatchService.createTemporaryUser(values);
      
      setCreatedUser(result);
      setCreateModalVisible(false);
      setPasswordModalVisible(true);
      form.resetFields();
      
      message.success('Temporary user created successfully!');
      fetchTemporaryUsers();
    } catch (error) {
      message.error('Failed to create temporary user');
      console.error('Error creating temporary user:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('Copied to clipboard!');
    }).catch(() => {
      message.error('Failed to copy to clipboard');
    });
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (username: string) => <Text strong>{username}</Text>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: 'Temporary Password',
      dataIndex: 'tmpPassword',
      key: 'tmpPassword',
      render: (password: string) => {
        if (!password) {
          return <Text type="secondary">N/A</Text>;
        }
        return (
          <Text code copyable={{ onCopy: () => copyToClipboard(password) }}>
            {password}
          </Text>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'status',
      render: (enabled: boolean, record: TemporaryUser) => {
        if (record.deleted) {
          return <Tag color="red">Deleted</Tag>;
        }
        return enabled ? <Tag color="green">Active</Tag> : <Tag color="orange">Inactive</Tag>;
      },
    },
  ];

  return (
    <div className="temporary-user-management">
      <Card style={{ margin: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <UserAddOutlined /> Temporary User Management
            </Title>
            <Text type="secondary">
              Create and manage temporary users who can withdraw your products
            </Text>
          </div>
          <Space>
            <Button 
              icon={<SyncOutlined />} 
              onClick={fetchTemporaryUsers}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              Create Temporary User
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={temporaryUsers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) => 
              `${range[0]}-${range[1]} of ${total} temporary users`,
          }}
          locale={{
            emptyText: 'No temporary users found. Create one to get started.',
          }}
        />
      </Card>

      {/* Create User Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UserAddOutlined style={{ marginRight: '8px' }} />
            Create Temporary User
          </div>
        }
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: '16px' }}>
          <Text type="secondary">
            Create a temporary user account that can be authorized to withdraw your products from the warehouse. 
            You can set a custom password for the temporary user.
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateUser}
          requiredMark="optional"
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Please enter a username!' },
              { min: 3, message: 'Username must be at least 3 characters!' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: 'Username can only contain letters, numbers, and underscores!' },
            ]}
          >
            <Input 
              placeholder="Enter unique username" 
              prefix={<UserAddOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Full Name"
            rules={[
              { required: true, message: 'Please enter the full name!' },
              { min: 2, message: 'Name must be at least 2 characters!' },
            ]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter an email address!' },
              { type: 'email', message: 'Please enter a valid email address!' },
            ]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>

          <Form.Item
            name="company"
            label="Company"
            rules={[
              { required: true, message: 'Please enter the company name!' },
              { min: 2, message: 'Company name must be at least 2 characters!' },
            ]}
          >
            <Input placeholder="Enter company name" />
          </Form.Item>

          <Form.Item
            name="temporarypassword"
            label="Temporary Password"
            rules={[
              { required: true, message: 'Please enter a temporary password!' },
              { min: 6, message: 'Password must be at least 6 characters!' },
              { max: 50, message: 'Password must not exceed 50 characters!' },
            ]}
          >
            <Input.Password 
              placeholder="Enter temporary password"
              visibilityToggle
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => {
                  setCreateModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<UserAddOutlined />}
              >
                Create User
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UserAddOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
            Temporary User Created Successfully!
          </div>
        }
        open={passwordModalVisible}
        onOk={() => setPasswordModalVisible(false)}
        onCancel={() => setPasswordModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setPasswordModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
        centered
      >
        {createdUser && (
          <div className="password-display">
            <div style={{ marginBottom: '20px' }}>
              <Text>
                The temporary user has been created successfully. Please share these credentials with the authorized person:
              </Text>
            </div>

            <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <div style={{ marginBottom: '12px' }}>
                <Text strong>Username: </Text>
                <Text code copyable={{ onCopy: () => copyToClipboard(createdUser.username) }}>
                  {createdUser.username}
                </Text>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <Text strong>Temporary Password: </Text>
                <Text code copyable={{ onCopy: () => copyToClipboard(createdUser.temporaryPassword) }}>
                  {createdUser.temporaryPassword}
                </Text>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <Text strong>Name: </Text>
                <Text>{createdUser.name}</Text>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <Text strong>Email: </Text>
                <Text>{createdUser.email}</Text>
              </div>

              <div>
                <Text strong>Company: </Text>
                <Text>{createdUser.company}</Text>
              </div>
            </Card>

            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff7e6', border: '1px solid #ffd591', borderRadius: '6px' }}>
              <Text type="warning" strong>⚠️ Important:</Text>
              <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                <li>This is the only time the password will be displayed</li>
                <li>Please save these credentials securely</li>
                <li>The temporary user can now log in and withdraw your products</li>
                <li>You can manage this user's access from the user management page</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TemporaryUserManagement;