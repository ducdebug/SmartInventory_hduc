import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import './TestNotification.css';

const TestNotification: React.FC = () => {
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState({ success: false, message: '' });
  const { user } = useAuth();

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message) {
      setResult({
        success: false,
        message: 'Please enter a message'
      });
      return;
    }

    const recipientId = userId || (user ? user.username : '');
    
    if (!recipientId) {
      setResult({
        success: false,
        message: 'Please specify a recipient'
      });
      return;
    }

    setSending(true);
    setResult({ success: false, message: '' });

    try {
      await axios.post('/api/notifications/test', {
        userId: recipientId,
        message
      });

      setResult({
        success: true,
        message: `Notification sent to ${recipientId}`
      });
      setMessage('');
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to send notification'
      });
      console.error('Error sending test notification:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="test-notification-panel">
      <h2>Send Test Notification</h2>
      <form onSubmit={handleSendNotification}>
        <div className="form-group">
          <label htmlFor="userId">Recipient User ID</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder={`Default: ${user?.username || 'current user'}`}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="message">Notification Message</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notification message"
            required
          />
        </div>

        <button 
          type="submit" 
          className="send-btn"
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Send Notification'}
        </button>
      </form>

      {result.message && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
};

export default TestNotification;