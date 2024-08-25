import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function ChatPage() {
  const { enrollmentNo, userEnrollmentNo } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatMessagesRef = useRef(null);
  const socketRef = useRef(null);
  const initializedRef = useRef(false);
  const typingTimeoutRef = useRef(null); // Ref to track typing timeout
  const unsavedMessagesRef = useRef([]); // Ref to store unsaved messages

  // Function to initialize WebSocket connection
  const initializeWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const roomName = `chat_${[enrollmentNo, userEnrollmentNo].sort().join('_')}`;
    const socketUrl = `${protocol}://${window.location.hostname}:8000/ws/${roomName}/`;

    socketRef.current = new WebSocket(socketUrl);

    socketRef.current.onopen = () => {
      console.log('WebSocket connection opened');
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prevMessages) => [
        ...prevMessages,
        { email: data.username, content: data.message },
      ]);

      // Scroll to bottom after receiving new message
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socketRef.current.onclose = async (event) => {
      console.log('WebSocket connection closed', event);

      // When WebSocket closes, send all unsaved messages to the backend
      await sendUnsavedMessages();
    };
  };

  // Fetch previous messages from the backend
  const fetchMessages = async () => {
    const roomName = `chat_${[enrollmentNo, userEnrollmentNo].sort().join('_')}`;
    try {
      const response = await axios.get(`http://127.0.0.1:8000/rooms/${roomName}/messages/`);
      setMessages(response.data); // Assume the backend returns a list of messages

      // Scroll to bottom after fetching messages
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Initialize WebSocket and fetch messages manually if not initialized
  if (!initializedRef.current) {
    initializedRef.current = true;
    initializeWebSocket();
    fetchMessages();
  }

  // Function to send unsaved messages to the backend
  const sendUnsavedMessages = async () => {
    if (unsavedMessagesRef.current.length > 0) {
      try {
        await Promise.all(
          unsavedMessagesRef.current.map(async (message) => {
            const messageData = {
              content: message.content,
              enrollmentNo: message.email, // Assume the email is the enrollment number
              room_slug: `chat_${[enrollmentNo, userEnrollmentNo].sort().join('_')}`,
              time_added: new Date().toISOString(), // Use the current time or modify as needed
            };
            await axios.post(`http://127.0.0.1:8000/create-message/`, messageData);
          })
        );
        console.log('Unsaved messages sent to the backend');
        unsavedMessagesRef.current = []; // Clear the unsaved messages after successful save
      } catch (error) {
        console.error('Error sending unsaved messages:', error);
      }
    }
  };

  // Handle send message action
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const messageData = {
      content: newMessage,
      email: enrollmentNo, // Use enrollmentNo for the current user
      room_slug: `chat_${[enrollmentNo, userEnrollmentNo].sort().join('_')}`,
      time_added: new Date().toISOString(), // Default to now
      isLocal: true, // Mark message as local
    };

    // Update state with the new message
    setMessages((prevMessages) => [...prevMessages, messageData]);
    setNewMessage('');

    // Add to unsaved messages
    unsavedMessagesRef.current.push(messageData);

    // Send message through WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ message: newMessage }));
    } else {
      console.error('WebSocket is not open');
    }

    // Reset typing timeout
    resetTypingTimeout();
  };

  // Reset typing timeout to send unsaved messages after inactivity
  const resetTypingTimeout = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendUnsavedMessages(); // Send unsaved messages if no typing for 5 seconds
    }, 4000);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
      <div className="p-10 lg:p-20 text-center">
        <h1 className="text-4xl lg:text-5xl text-white font-bold">
          Chat with {userEnrollmentNo}
        </h1>
      </div>
      <div className="lg:w-2/4 w-full mx-4 lg:mx-auto p-4 bg-white rounded-2xl shadow-lg">
        <div
          className="chat-messages space-y-3 overflow-y-auto max-h-96 p-4"
          ref={chatMessagesRef}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`${
                msg.user === enrollmentNo
                  ? 'bg-teal-500 text-white self-end'
                  : 'bg-gray-200 text-black self-start'
              } rounded-lg p-3 max-w-xs lg:max-w-md break-words`}
            >
              <b>{msg.user}</b>: {msg.content}
            </div>
          ))}
        </div>
      </div>
      <div className="lg:w-2/4 w-full mt-6 mx-4 lg:mx-auto p-4 bg-white rounded-2xl shadow-lg">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              resetTypingTimeout(); // Reset timeout on typing
            }}
            className="flex-1 px-4 py-3 mr-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Your message..."
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition-all duration-200 shadow-lg"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;
