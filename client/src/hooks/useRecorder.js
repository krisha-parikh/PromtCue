import { useRef } from "react";

export default function useRecorder({ onChunkReady, chunkMs = 30000 }) {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timeoutRef = useRef(null);
  const shouldContinueRef = useRef(false);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    shouldContinueRef.current = true;

    const startRecorder = () => {
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size > 0) {
          await onChunkReady(blob);
        }

        if (shouldContinueRef.current) {
          startRecorder();
        }
      };

      recorder.start();

      timeoutRef.current = setTimeout(() => {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      }, chunkMs);
    };

    startRecorder();
  };

  const stop = () => {
    shouldContinueRef.current = false;
    clearTimeout(timeoutRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  return { start, stop };
}