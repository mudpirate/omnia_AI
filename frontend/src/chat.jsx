import React, { useState, useRef, useEffect } from "react";

// --- SVG Icons ---
const UserIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SparkleIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 12l2 2 2-2M14 6l1 1 1-1M5 18l1 1 1-1M21 3l-1 1 1-1M3 21l1 1 1-1M12 2v2M20 12h2M12 20v2M2 12h2" />
  </svg>
);

const LinkIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 7h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4" />
    <polyline points="10 21 3 14 10 7" />
    <line x1="21" y1="21" x2="14" y2="14" />
  </svg>
);

// Loader
const Loader = () => (
  <div className="flex items-center space-x-2 p-3 text-cyan-400 transition-opacity duration-300">
    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-100" />
    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-200" />
    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-300" />
  </div>
);

// Product Card - High contrast, black background, white lines.
const ProductCard = ({ product }) => (
  <div className="relative p-5 bg-black border border-gray-800 rounded-xl shadow-lg transition-all duration-300 hover:border-white/50">
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Image with a darker placeholder style */}
      <div className="shrink-0 w-full sm:w-32 h-32 bg-black rounded-lg overflow-hidden flex items-center justify-center border border-gray-700 shadow-inner">
        <img
          src={product.image_url}
          alt={product.product_name}
          className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://placehold.co/128x128/000000/D1D5DB?text=NO_IMG";
          }}
        />
      </div>

      <div className="flex-1 min-w-0 text-white">
        <h3 className="text-xl font-bold text-white line-clamp-2 leading-tight">
          {product.product_name}
        </h3>

        <p className="text-sm text-gray-400 mt-1 italic">
          Sold by:{" "}
          <span className="font-semibold text-gray-200">
            {product.store_name}
          </span>
        </p>

        {/* Price */}
        <p className="text-3xl font-extrabold text-cyan-400 mt-2 font-mono">
          {typeof product.price_kwd === "number"
            ? product.price_kwd.toFixed(2)
            : product.price_kwd}{" "}
          KWD
        </p>

        {/* Spec Highlights as distinct badges */}
        <div className="flex flex-wrap gap-2 mt-4 border-b border-gray-800 pb-3">
          {Array.isArray(product.spec_highlights) &&
            product.spec_highlights.map((spec, idx) => (
              <span
                key={idx}
                className="px-3 py-1 text-xs font-medium bg-black text-white border border-gray-700 rounded-full shadow-md"
              >
                {spec}
              </span>
            ))}
        </div>
      </div>
    </div>

    {/* Link button relocated below specs/details */}
    <a
      href={product.product_url}
      target="_blank"
      rel="noopener noreferrer"
      // Black background, white text, white border
      className="mt-4 w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white border border-white rounded-lg hover:bg-white hover:text-black transition duration-200 shadow-lg"
      title="View Product Page"
    >
      <LinkIcon className="w-5 h-5 mr-2" />
      View Product
    </a>
  </div>
);

// Response container - Adjusted background and text color
const ProductResponse = ({ data }) => (
  <div className="space-y-4">
    <p className="text-gray-100 font-medium whitespace-pre-wrap px-4 pt-4">
      {data.message}
    </p>

    {/* Product List Container - Ensures a clean black background inside the message area */}
    <div className="space-y-3 p-4 bg-black rounded-xl border border-gray-700 shadow-inner">
      <h4 className="text-sm font-semibold text-cyan-400 border-b border-gray-700 pb-2">
        ✨ Recommended Products:
      </h4>
      <div className="grid gap-4">
        {data.products.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </div>
    </div>

    {data.disclaimer && (
      <div className="pt-2 text-sm text-gray-400 px-4 italic">
        {data.disclaimer}
      </div>
    )}
  </div>
);

// Message bubble - Dark theme
const Message = ({ message }) => {
  const isUser = message.sender === "user";
  const hasStructuredData =
    message.sender === "ai" && message.data && message.data.products;

  const userIcon = (
    <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-md border border-white">
      <UserIcon className="w-4 h-4" />
    </div>
  );

  const aiIcon = (
    <div className="w-8 h-8 rounded-full bg-black text-cyan-400 flex items-center justify-center shrink-0 shadow-md border border-cyan-400/50">
      <SparkleIcon className="w-5 h-5" />
    </div>
  );

  return (
    <div className="w-full bg-black border-b border-gray-800 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-start gap-4">
        <div className="self-start">{isUser ? userIcon : aiIcon}</div>
        <div className="flex-1 min-w-0">
          {hasStructuredData ? (
            <ProductResponse data={message.data} />
          ) : (
            <p className="text-gray-100 font-normal whitespace-pre-wrap leading-relaxed">
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Splash Screen
const Splash = () => (
  <div className="flex flex-col items-center justify-center h-full text-center px-6 text-white">
    <SparkleIcon className="w-16 h-16 text-cyan-400 mb-6 animate-pulse" />
    <h2 className="text-5xl font-bold font-mono text-cyan-200 mb-4 tracking-wider drop-shadow-lg">
      Omnia AI
    </h2>
    <p className="text-xl font-sans text-gray-300 max-w-lg mb-8">
      Your specialized assistant for purchasing electronics at the **best
      price**.
    </p>
    <div className="mt-6 p-3 bg-black rounded-xl border border-gray-700 shadow-inner">
      <p className="text-md text-gray-400 font-mono italic">
        Example: "Find me the cheapest Samsung Galaxy S23"
      </p>
    </div>
  </div>
);

// --- Main App Component ---
export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // --- Environment Variable Configuration ---
  const API_PORT = process.env.REACT_APP_API_PORT || 4000;
  const API_BASE_URL = `http://localhost:${API_PORT}`;
  const CHAT_ENDPOINT = `${API_BASE_URL}/chat`;
  // ------------------------------------------

  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        setMessages([
          {
            id: 1,
            text: `Hello! I'm your Omnia AI shopping assistant. I'm ready to find products for you! (Backend: ${CHAT_ENDPOINT})`,
            sender: "ai",
          },
        ]);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleFetchWithRetry = async (url, options, maxRetries = 3) => {
    let lastError = null;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          if (response.status >= 500 && response.status < 600) {
            throw new Error(`Server error! status: ${response.status}`);
          }
          throw new Error(`Client error! status: ${response.status}`);
        }
        return response;
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;

    const userMessage = { id: Date.now(), text: query, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await handleFetchWithRetry(
        CHAT_ENDPOINT, // Using environment-configured endpoint
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        }
      );

      const serverResponse = await response.json();

      let structuredData = null;
      let displayText = serverResponse.message || serverResponse.reply || "";

      if (serverResponse.reply) {
        try {
          const parsed = JSON.parse(serverResponse.reply);
          if (parsed.products && Array.isArray(parsed.products)) {
            structuredData = parsed;
            displayText = parsed.message || displayText;
          }
        } catch (err) {
          // reply was not JSON
        }
      } else if (
        serverResponse.products &&
        Array.isArray(serverResponse.products)
      ) {
        structuredData = serverResponse;
        displayText = serverResponse.message || displayText;
      }

      const aiMessage = {
        id: Date.now() + 1,
        text: displayText,
        data: structuredData,
        sender: "ai",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error fetching chat response:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: `Sorry, I could not connect to the backend at ${CHAT_ENDPOINT}. Please ensure the server is running. Error: ${error.message}`,
        sender: "ai",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const displayMessages = messages.filter(
    (msg) =>
      msg.sender === "user" ||
      msg.text ||
      (msg.data && msg.data.products && msg.data.products.length > 0)
  );

  const showSplash =
    displayMessages.length === 1 &&
    displayMessages[0].sender === "ai" &&
    !isLoading;

  return (
    <div className="flex flex-col h-screen bg-black font-sans antialiased text-gray-200">
      <header className="flex items-center justify-between p-4 bg-black border-b border-cyan-500/20 text-white shadow-xl sticky top-0 z-10">
        <h1 className="text-xl sm:text-2xl font-bold font-mono flex items-center gap-2 tracking-wide text-white">
          <SparkleIcon className="w-6 h-6 text-cyan-400 animate-spin-slow" />
          <span>Omnia AI</span>
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto w-full relative">
        {/* Background is pure black */}
        <div className="absolute inset-0 bg-black"></div>

        {/* Chat content container */}
        <div className="relative z-0 h-full">
          {showSplash ? (
            <Splash />
          ) : (
            <div className="pb-28">
              {displayMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="opacity-100 transition-opacity duration-500"
                >
                  <Message message={msg} />
                </div>
              ))}

              {isLoading && (
                <div className="w-full bg-black border-b border-gray-800 py-6">
                  <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-black text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-400/50">
                      <SparkleIcon className="w-5 h-5" />
                    </div>
                    <Loader />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      <footer className="w-full bg-black border-t border-gray-700 p-4 sticky bottom-0 z-10 shadow-2xl">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-3 bg-black p-3 rounded-xl border border-gray-700 shadow-lg"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g., 'Find me the best wireless headphones under 100 KWD'"
              className="flex-1 p-2 outline-none text-white bg-transparent placeholder-gray-500 focus:placeholder-gray-400 transition"
              disabled={isLoading}
            />

            <button
              type="submit"
              className={`p-3 rounded-lg transition duration-200 flex items-center justify-center shadow-lg ${
                isLoading
                  ? "bg-gray-700 cursor-not-allowed text-gray-500"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white active:scale-95 transform"
              }`}
              disabled={isLoading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
