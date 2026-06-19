import { useEffect, useRef, useState } from "react";

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function ControlBar({
  apiKey,
  isRecording,
  isTranscribing,
  isFetchingSuggestions,
  onToggleRecording,
  onRefresh,
  onExport,
  onOpenSettings,
  onClearSession,
}) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      setElapsed(0);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRecording]);

  const statusText = !apiKey
    ? "Enter your Groq API key in Settings to begin."
    : isRecording
      ? "Recording live... transcript appends every 30s."
      : isTranscribing
        ? "Transcribing latest chunk..."
        : "Click mic to start.";

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <button
          className={`mic-circle ${isRecording ? "recording" : ""}`}
          onClick={onToggleRecording}
          title={isRecording ? "Stop microphone" : "Start microphone"}
          type="button"
        >
          {isRecording ? "■" : "🎤"}
        </button>

        <div className="transport-readout">
          <div className={`level-meter ${isRecording ? "is-live" : ""}`} aria-hidden="true">
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </div>
          <span className={`tape-counter ${isRecording ? "is-live" : ""}`}>
            {formatElapsed(elapsed)}
          </span>
        </div>

        <button
          className="panel-btn secondary"
          onClick={onClearSession}
          type="button"
        >
          Clear
        </button>

        <div className="mic-status-block">
          <div className="section-label">Mic / transcript</div>
          <div className="section-subtext">{statusText}</div>
        </div>
      </div>

      <div className="top-bar-right">
        <button
          className="panel-btn"
          onClick={onRefresh}
          disabled={!apiKey || isFetchingSuggestions || isTranscribing}
          type="button"
        >
          {isFetchingSuggestions ? "Reloading..." : "Reload suggestions"}
        </button>

        <button
          className="panel-btn secondary"
          onClick={onOpenSettings}
          type="button"
        >
          Settings
        </button>

        <button
          className="panel-btn secondary"
          onClick={onExport}
          type="button"
        >
          Export
        </button>
      </div>
    </div>
  );
}

export default ControlBar;
