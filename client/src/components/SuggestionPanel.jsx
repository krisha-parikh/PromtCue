import { useEffect, useRef, useState } from "react";

const formatTimeOnly = (value) => {
  if (!value) return "Now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Now";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

function SuggestionsPanel({
  suggestionBatches = [],
  onExpandSuggestion = () => {},
  isFetchingSuggestions = false,
}) {
  const containerRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showNewBadge, setShowNewBadge] = useState(false);

  // 🧠 Track scroll position
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    const threshold = 100;
    const isBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

    setIsNearBottom(isBottom);

    // hide badge when user scrolls back to bottom
    if (isBottom) {
      setShowNewBadge(false);
    }
  };

  // 🔔 Show badge when new suggestions arrive and user is not at bottom
  useEffect(() => {
    if (!isNearBottom && suggestionBatches.length > 0) {
      setShowNewBadge(true);
    }
  }, [suggestionBatches, isNearBottom]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-step">Suggestions</div>
        <div className="panel-status">
          {suggestionBatches.length} batches
        </div>
      </div>

      <div className="panel-body">
        <div className="info-box">
          Generates 3 fresh suggestions from recent transcript context on reload or auto-refresh.
        </div>

        {/* 🔔 New Suggestions Badge */}
        {showNewBadge && (
          <button
            className="panel-btn"
            style={{ marginBottom: "10px" }}
            onClick={() => {
              containerRef.current.scrollTop = 0;
              setShowNewBadge(false);
            }}
          >
            New suggestions ↓
          </button>
        )}

        <div
          className="suggestions-scroll"
          ref={containerRef}
          onScroll={handleScroll}
        >
          {/* Loading state */}
          {isFetchingSuggestions && (
            <div className="suggestion-batch suggestion-batch-loading">
              <div className="batch-label">
                Generating fresh suggestions...
              </div>

              <div className="suggestion-list">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="suggestion-card loading-card"
                    aria-hidden="true"
                  >
                    <div className="skeleton-pill" />
                    <div className="skeleton-line w-80" />
                    <div className="skeleton-line w-100" />
                    <div className="skeleton-line w-75" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {suggestionBatches.length === 0 && !isFetchingSuggestions ? (
            <div className="empty-state">
              Suggestions appear here once recording starts.
            </div>
          ) : (
            suggestionBatches.map((batch, batchIndex) => (
              <div
                key={
                  batch.id ||
                  batch.created_at ||
                  batch.createdAt ||
                  batchIndex
                }
                className="suggestion-batch"
              >
                <div className="batch-label">
                  {formatTimeOnly(
                    batch.created_at || batch.createdAt
                  )}
                </div>

                <div className="suggestion-list">
                  {(batch.suggestions || []).map((item, index) => (
                    <button
                      key={item.id || `${batchIndex}-${index}`}
                      className="suggestion-card"
                      data-type={(item.type || "").toLowerCase()}
                      onClick={() => onExpandSuggestion(item)}
                      type="button"
                    >
                      <div className="suggestion-type">
                        {item.type || "suggestion"}
                      </div>

                      <div className="suggestion-title">
                        {item.title}
                      </div>

                      <div className="suggestion-preview">
                        {item.preview}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default SuggestionsPanel;
