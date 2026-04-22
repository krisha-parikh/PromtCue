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
  const statusText = !apiKey
    ? "Enter your Groq API key in Settings to begin."
    : isRecording
      ? "Recording live... Transcript appends every 30s."
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

        <button
          className="panel-btn secondary"
          onClick={onClearSession}
          type="button"
        >
          Clear
        </button>

        <div className="mic-status-block">
          <div className="section-label">MIC / TRANSCRIPT</div>
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