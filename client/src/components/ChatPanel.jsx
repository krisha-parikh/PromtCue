import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function ChatPanel({
  chatMessages = [],
  onSendMessage = () => {},
  isSendingChat = false,
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!input.trim() || isSendingChat) return;

    onSendMessage(input.trim());
    setInput("");
  };

  // 🔍 Detect if user is near bottom
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    const threshold = 100;
    const isBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

    setIsNearBottom(isBottom);
  };

  // 🔥 Auto-scroll only if user is near bottom
  useEffect(() => {
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isSendingChat, isNearBottom]);

  return (
    <section className="panel chat-panel">
      <div className="panel-header">
        <div className="panel-step">Chat</div>
        <div className="panel-status">Session-only</div>
      </div>

      <div className="panel-body">
        <div className="info-box">
          Clicking a suggestion adds it here and returns a detailed answer. You can also ask your own follow-up.
        </div>
        
        <div className="chat-body">
          <div
            className="chat-messages"
            ref={containerRef}
            onScroll={handleScroll}
          >
            {/* Empty state */}
            {chatMessages.length === 0 && !isSendingChat ? (
              <div className="empty-state">
                Click a suggestion or type a question below.
              </div>
            ) : (
              <>
                {/* Messages */}
                {chatMessages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`chat-bubble ${msg.role}`}
                  >
                    <div className="chat-role">
                      [{msg.role === "assistant" ? "copilot" : "you"}]
                    </div>

                    {msg.role === "assistant" ? (
                      <div className="markdown-content">
                        {msg?.text?.trim() ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                          </ReactMarkdown>
                        ) : (
                          <span className="subtle-status">
                            No response generated
                          </span>
                        )}
                      </div>
                    ) : (
                      <div>{msg?.text || ""}</div>
                    )}
                  </div>
                ))}

                {/* Loading / pending */}
                {isSendingChat && (
                  <div className="chat-bubble assistant pending">
                    <div className="chat-role">[copilot]</div>
                    <div className="pending-label">Thinking...</div>
                    <div className="skeleton-line w-85" />
                    <div className="skeleton-line w-100" />
                    <div className="skeleton-line w-65" />
                  </div>
                )}

                {/* Scroll anchor */}
                <div ref={bottomRef} />
              </>
            )}
          </div>
        </div>

        {/* Input */}
        <form className="chat-input-row" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up question..."
            disabled={isSendingChat}
          />
          <button type="submit" disabled={isSendingChat || !input.trim()}>
            {isSendingChat ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default ChatPanel;
