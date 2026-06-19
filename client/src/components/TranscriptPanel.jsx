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

function TranscriptPanel({
  transcriptChunks = [],
  isRecording = false,
  isTranscribing = false,
}) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const statusLabel = isRecording
    ? "LIVE"
    : isTranscribing
    ? "TRANSCRIBING"
    : "IDLE";

  // Track scroll position
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    const threshold = 100;
    const isBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

    setIsNearBottom(isBottom);
  };

  // Smart auto-scroll
  useEffect(() => {
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcriptChunks, isTranscribing, isNearBottom]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-step">1. MIC & TRANSCRIPT</div>
        <div className="panel-status">{statusLabel}</div>
      </div>

      <div className="panel-body">
        <div className="info-box">
          The transcript scrolls and appends new chunks every ~10 seconds while
          recording.
        </div>

        <div
          className="transcript-scroll"
          ref={containerRef}
          onScroll={handleScroll}
        >
          {transcriptChunks.length === 0 && !isTranscribing ? (
            <div className="empty-state">
              No transcript yet — start the mic.
            </div>
          ) : (
            <>
              {transcriptChunks.map((chunk, idx) => (
                <div
                  key={
                    chunk.id ||
                    chunk.created_at ||
                    chunk.createdAt ||
                    idx
                  }
                  className="transcript-item"
                >
                  <div className="transcript-time">
                    {formatTimeOnly(
                      chunk.created_at || chunk.createdAt
                    )}
                  </div>
                  <div className="transcript-text">{chunk.text}</div>
                </div>
              ))}

              {isTranscribing && (
                <div className="transcript-item pending">
                  <div className="transcript-time">
                    Transcribing latest audio chunk...
                  </div>
                  <div className="skeleton-line w-90" />
                  <div className="skeleton-line w-100" />
                  <div className="skeleton-line w-70" />
                </div>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default TranscriptPanel;
