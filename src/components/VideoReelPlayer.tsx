"use client";

import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Film, Pause, Play } from "lucide-react";

type VideoReelPlayerProps = {
  durationLabel: string;
  poster?: string;
  src: string;
  title: string;
};

type CSSVariableProperties = CSSProperties & Record<`--${string}`, string>;

export default function VideoReelPlayer({
  durationLabel,
  poster,
  src,
  title,
}: VideoReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlayback = async () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    video.pause();
    setIsPlaying(false);
  };

  const seekVideo = (value: string) => {
    const video = videoRef.current;
    const nextProgress = Number(value);

    setProgress(nextProgress);

    if (!video || !video.duration) {
      return;
    }

    video.currentTime = (nextProgress / 100) * video.duration;
  };

  return (
    <div
      className={`custom-video-player${isPlaying ? " is-playing" : ""}`}
      style={
        {
          "--video-progress": `${progress}%`,
        } as CSSVariableProperties
      }
    >
      <video
        ref={videoRef}
        onClick={togglePlayback}
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
        }}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0);
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);
        }}
        playsInline
        poster={poster}
        preload="metadata"
        src={src}
      >
        <a href={src}>Open video reel</a>
      </video>

      <button
        aria-label={`${isPlaying ? "Pause" : "Play"} ${title}`}
        className="video-visual-button"
        onClick={togglePlayback}
        type="button"
      >
        <span className="video-control-icon" aria-hidden="true">
          {isPlaying ? <Pause size={22} /> : <Play fill="currentColor" size={22} />}
        </span>
      </button>

      <div className="video-preview-meta">
        <div className="video-preview-meta-row">
          <Film aria-hidden="true" size={15} />
          <strong>{durationLabel}</strong>
        </div>
        <label className="video-timeline">
          <span className="sr-only">Seek {title}</span>
          <span className="video-timeline-rail" aria-hidden="true" />
          <input
            aria-label={`Seek ${title}`}
            disabled={!duration}
            max="100"
            min="0"
            onChange={(event) => seekVideo(event.currentTarget.value)}
            step="0.1"
            type="range"
            value={progress}
          />
        </label>
      </div>
    </div>
  );
}
