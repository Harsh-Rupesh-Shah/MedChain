import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Search, Send, Paperclip, Image } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Conversation {
  user: {
    _id: string;
    name: string;
    role: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    read: boolean;
  };
}

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
  };
  receiver: {
    _id: string;
    name: string;
  };
  attachments: Array<{
    type: string;
    url: string;
  }>;
  createdAt: string;
  read: boolean;
}

const MessagingSystem = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser);
    }
  }, [selectedUser]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const response = await api.get(`/messages/${userId}`);
      setMessages(response.data);
      markAsRead(userId);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;

    try {
      const response = await api.post('/messages', {
        receiverId: selectedUser,
        content: newMessage
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      loadConversations(); // Refresh conversations list
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const markAsRead = async (userId: string) => {
    try {
      await api.put(`/messages/read/${userId}`);
      loadConversations(); // Refresh conversations to update unread status
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg">
      {/* Conversations List */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(600px-73px)]">
          {filteredConversations.map((conv) => (
            <div
              key={conv.user._id}
              onClick={() => setSelectedUser(conv.user._id)}
              className={`p-4 cursor-pointer hover:bg-slate-50 ${
                selectedUser === conv.user._id ? 'bg-indigo-50' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{conv.user.name}</h3>
                  <p className="text-sm text-slate-600 truncate">
                    {conv.lastMessage.content}
                  </p>
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                  {!conv.lastMessage.read && conv.lastMessage.sender !== user?._id && (
                    <span className="ml-2 bg-indigo-500 text-white px-2 py-1 rounded-full">
                      New
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b">
              <h3 className="font-semibold">
                {conversations.find(c => c.user._id === selectedUser)?.user.name}
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
                    {message.attachments.map((attachment, index) => (
                      <div key={index} className="mt-2">
                        {attachment.type === 'image' ? (
                          <img
                            src={attachment.url}
                            alt="attachment"
                            className="max-w-full rounded"
                          />
                        ) : (
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline"
                          >
                            View Attachment
                          </a>
                        )}
                      </div>
                    ))}
                    <span className="text-xs opacity-75 mt-1 block">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
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
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingSystem;