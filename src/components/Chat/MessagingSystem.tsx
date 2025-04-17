import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Search, Send, Paperclip, Image } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { socket, joinRoom } from '../../services/socket';

interface User {
  _id: string;
  name: string;
  role: string;
}

interface Message {
  _id: string;
  content: string;
  sender: User;
  receiver: User;
  createdAt: string;
  read: boolean;
}

const MessagingSystem = () => {
  const { user } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAvailableUsers();
    
    // Join user's room for receiving messages
    if (user?._id) {
      joinRoom(user._id);
    }

    // Socket event listeners
    socket.on('new_message', (message: Message) => {
      console.log('Received new message:', message);
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      
      // Show notification if message is from selected user
      if (message.sender._id === selectedUser) {
        toast.success(`New message from ${message.sender.name}`);
      }
    });

    return () => {
      socket.off('new_message');
    };
  }, [user?._id, selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser);
    }
  }, [selectedUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAvailableUsers = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'patient' ? '/doctors' : '/doctors/patients';
      const response = await api.get(endpoint);
      setAvailableUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const response = await api.get(`/messages/${userId}`);
      setMessages(response.data);
      scrollToBottom();
      markMessagesAsRead(userId);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const markMessagesAsRead = async (userId: string) => {
    try {
      await api.put(`/messages/read/${userId}`);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;

    try {
      const messageData = {
        receiverId: selectedUser,
        content: newMessage.trim()
      };

      const response = await api.post('/messages', messageData);
      
      // Add the new message to the messages array
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      scrollToBottom();

      // Emit socket event
      socket.emit('private_message', {
        receiverId: selectedUser,
        content: newMessage.trim()
      });

      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const filteredUsers = availableUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-lg h-[600px] flex">
      {/* Users List */}
      <div className="w-1/3 border-r">
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(600px-73px)]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u._id}
                onClick={() => setSelectedUser(u._id)}
                className={`p-4 cursor-pointer hover:bg-slate-50 ${
                  selectedUser === u._id ? 'bg-indigo-50' : ''
                }`}
              >
                <h3 className="font-semibold">{u.name}</h3>
                <p className="text-sm text-slate-600">{u.role}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b">
              <h3 className="font-semibold">
                {availableUsers.find(u => u._id === selectedUser)?.name}
              </h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${
                    message.sender._id === user?._id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender._id === user?._id
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-100'
                    }`}
                  >
                    <p>{message.content}</p>
                    <span className="text-xs opacity-75 mt-1 block">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-slate-100 rounded-full">
                  <Paperclip className="h-5 w-5 text-slate-500" />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-full">
                  <Image className="h-5 w-5 text-slate-500" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') sendMessage();
                  }}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={sendMessage}
                  className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            Select a user to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingSystem;