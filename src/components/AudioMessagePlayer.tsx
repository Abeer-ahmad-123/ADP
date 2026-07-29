"use client";

import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Pause, Play } from "lucide-react";

type AudioMessagePlayerProps = {
  durationLabel: string;
  src: string;
  title: string;
};

type CSSVariableProperties = CSSProperties & Record<`--${string}`, string>;

const WAVEFORM_BARS = [44, 72, 36, 88, 58, 96, 50, 78, 42, 68];

export default function AudioMessagePlayer({
  durationLabel,
  src,
  title,
}: AudioMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    audio.pause();
    setIsPlaying(false);
  };

  return (
    <div
      className={`media-preview audio-preview custom-audio-player${
        isPlaying ? " is-playing" : ""
      }`}
    >
      <button
        aria-label={`${isPlaying ? "Pause" : "Play"} ${title}. ${durationLabel}`}
        className="audio-preview-control"
        onClick={togglePlayback}
        type="button"
      >
        {isPlaying ? (
          <Pause aria-hidden="true" size={17} />
        ) : (
          <Play aria-hidden="true" fill="currentColor" size={17} />
        )}
      </button>
      <strong className="audio-preview-label">Audio message</strong>
      <div className="audio-wave" aria-hidden="true">
        {WAVEFORM_BARS.map((height, index) => (
          <i
            key={`${title}-${index}`}
            style={
              {
                "--bar-delay": `${index * 90}ms`,
                "--bar-height": `${height}%`,
              } as CSSVariableProperties
            }
          />
        ))}
      </div>
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false);
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        preload="metadata"
        src={src}
      >
        <a href={src}>Open audio message</a>
      </audio>
    </div>
  );
}
