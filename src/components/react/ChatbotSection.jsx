import { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "¡Hola! 👋 Soy Wall-E, el asistente de SpacesDevs. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre:\n\n• Nuestro **equipo** de expertos\n• Los **proyectos** que hemos desarrollado\n• Nuestra **experiencia** en el mercado\n• Cómo **contactarnos**",
      sender: "bot",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const connectWebSocket = () => {
      setIsLoading(true);
      const ws = new WebSocket("ws://localhost:3000");
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsLoading(false);
      };

      ws.onmessage = (event) => {
        setMessages((prev) => [...prev, { text: event.data, sender: "bot" }]);
      };

      ws.onerror = () => {
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            text: "⚠️ Error de conexión. Por favor intenta nuevamente.",
            sender: "error",
          },
        ]);
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (isOpen) {
          setTimeout(connectWebSocket, 3000);
        }
      };
    };

    connectWebSocket();

    return () => {
      socketRef.current?.close();
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || !socketRef.current) return;

    setMessages((prev) => [...prev, { text: trimmedInput, sender: "user" }]);
    setInputValue("");

    try {
      socketRef.current.send(trimmedInput);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          text: "⚠️ Error al enviar el mensaje. Intenta nuevamente.",
          sender: "error",
        },
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botón flotante */}
      {!isOpen && (
        <div className="relative group flex justify-end">
          <div className="absolute bottom-full mb-3 right-0 transform translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-md border border-purple-500/30 whitespace-nowrap backdrop-blur-sm">
              ¿Necesitas ayuda? ¡Hablemos!
            </div>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-br from-purple-600 to-blue-500 p-5 rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-110 group-hover:shadow-purple-500/30"
            aria-label="Abrir chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        </div>
      )}

      {/* Chat */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-96 bg-gray-900/90 backdrop-blur-md rounded-xl shadow-2xl flex flex-col overflow-hidden border border-purple-500/30" style={{ height: "60vh", maxHeight: "600px" }}>
          {/* Encabezado */}
          <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white flex justify-between items-center border-b border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Wall-E - Asistente</h2>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : isLoading ? "bg-yellow-400" : "bg-red-400"}`}></span>
                  <span className="text-xs">{isConnected ? "En línea" : isLoading ? "Conectando..." : "Desconectado"}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Cerrar chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gradient-to-b from-gray-900/80 to-gray-900/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-xs px-4 py-3 rounded-lg shadow-sm backdrop-filter backdrop-blur-sm ${
                  msg.sender === "bot"
                    ? "bg-gray-800/70 border border-purple-500/20 self-start text-white"
                    : msg.sender === "error"
                    ? "bg-red-900/30 border border-red-500/20 text-red-300 self-start"
                    : "bg-gradient-to-r from-purple-600/80 to-blue-500/80 text-white self-end"
                }`}
              >
                <Markdown>{msg.text}</Markdown>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-gray-900/80 border-t border-purple-500/30 flex items-center gap-2 backdrop-blur-sm">
            <input
              type="text"
              className="flex-1 px-4 py-2 bg-gray-800/70 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder-gray-400 transition"
              placeholder="Escribe tu mensaje..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white p-2 rounded-lg transition flex items-center justify-center hover:shadow-purple-500/20 hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;