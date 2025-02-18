import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { socket } from '../../services/socket';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    role: string;
  };
  receiver: {
    _id: string;
    name: string;
    role: string;
  };
  attachments: Array<{
    type: string;
    url: string;
  }>;
  createdAt: string;
  read: boolean;
}

interface ChatWindowProps {
  receiverId: string;
  receiverName: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ receiverId, receiverName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChatHistory();
    socket.on('new_message', handleNewMessage);
    socket.on('typing', handleTypingStatus);

    return () => {
      socket.off('new_message');
      socket.off('typing');
    };
  }, [receiverId]);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/${receiverId}`);
      setMessages(response.data);
      scrollToBottom();
      markMessagesAsRead();
    } catch (error) {
      toast.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message: Message) => {
    if (message.sender._id === receiverId || message.receiver._id === receiverId) {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      if (message.sender._id === receiverId) {
        markMessagesAsRead();
      }
    }
  };

  const handleTypingStatus = (data: { userId: string }) => {
    if (data.userId === receiverId) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await api.put(`/messages/read/${receiverId}`);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await api.post('/messages', {
        receiverId,
        content: newMessage
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleTyping = () => {
    socket.emit('typing', { receiverId });

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    setTypingTimeout(setTimeout(() => {
      socket.emit('stop_typing', { receiverId });
    }, 3000));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center justify-between bg-indigo-50">
        <div>
          <h3 className="font-semibold text-lg">{receiverName}</h3>
          {isTyping && (
            <span className="text-sm text-slate-500">typing...</span>
          )}
        </div>
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
                  : 'bg-slate-100 text-slate-800'
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
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
              if (e.key === 'Enter') handleSend();
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSend}
            className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;