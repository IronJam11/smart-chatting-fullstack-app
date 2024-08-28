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
  const typingTimeoutRef = useRef(null);
  const unsavedMessagesRef = useRef([]);

  const initializeWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const roomName = `chat_${[enrollmentNo, userEnrollmentNo].sort().join('_')}`;
    const socketUrl = `${protocol}://${window.location.hostname}:8000/ws/${enrollmentNo}/${userEnrollmentNo}/`;

    socketRef.current = new WebSocket(socketUrl);

    socketRef.current.onopen = () => {
      console.log('WebSocket connection opened');
    };

    socketRef.current.onmessage = (event) => {
      console.log("-----------------------fuckyou--");
      console.log(event.data);
      console.log("-------------------------");
      const data = JSON.parse(event.data);
      setMessages((prevMessages) => [
        ...prevMessages,
        { enrollmentNo: data.enrollmentNo, content: data.message },
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

      if (unsavedMessagesRef.current.length > 0) {
        // Send unsaved messages and then close the WebSocket
        await sendUnsavedMessages();
      }

      // Now it is safe to close the WebSocket
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  };

  const fetchMessages = async () => {
    const roomName = `chat_${[enrollmentNo, userEnrollmentNo].sort().join('_')}`;
    try {
      const response = await axios.get(`http://127.0.0.1:8000/rooms/${roomName}/messages/`);
      setMessages(response.data);

      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  if (!initializedRef.current) {
    initializedRef.current = true;
    initializeWebSocket();
    fetchMessages();
  }

  const sendUnsavedMessages = async () => {
    if (unsavedMessagesRef.current.length > 0) {
      try {
        await Promise.all(
          unsavedMessagesRef.current.map(async (message) => {
            const messageData = {
              content: message.content,
              enrollmentNo: message.enrollmentNo,
              room_slug: `chat_${[enrollmentNo, userEnrollmentNo].sort().join('_')}`,
              time_added: new Date().toISOString(),
            };
            await axios.post(`http://127.0.0.1:8000/create-message/`, messageData);
          })
        );
        console.log('Unsaved messages sent to the backend');
        unsavedMessagesRef.current = []; // Clear after successful save
      } catch (error) {
        console.error('Error sending unsaved messages:', error);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const messageData = {
      content: newMessage,
      enrollmentNo: enrollmentNo,
      room_slug: `chat_${[enrollmentNo, userEnrollmentNo].sort().join('_')}`,
      time_added: new Date().toISOString(),
      isLocal: true,
      user: enrollmentNo
    };

    // setMessages((prevMessages) => [...prevMessages, messageData]);
    setNewMessage('');

    unsavedMessagesRef.current.push(messageData);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ message: newMessage }));
    } else {
      console.error('WebSocket is not open');
    }

    resetTypingTimeout();
  };

  const resetTypingTimeout = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendUnsavedMessages();
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Delay the WebSocket close to ensure all messages are sent
      const delayClose = async () => {
        if (unsavedMessagesRef.current.length > 0) {
          await sendUnsavedMessages();
        }
        // if (socketRef.current) {
        //   socketRef.current.close();
        // }
      };

      delayClose();
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
                msg.email=== enrollmentNo
                  ? 'bg-teal-500 text-white self-end'
                  : 'bg-gray-200 text-black self-start'
              } rounded-lg p-3 max-w-xs lg:max-w-md break-words`}
            >
              <b>{msg.user ? msg.user : msg.enrollmentNo}</b>: {msg.content}
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
              resetTypingTimeout();
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
