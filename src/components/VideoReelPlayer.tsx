"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Film, Pause, Play, Repeat, Volume2, VolumeX } from "lucide-react";

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
  const shouldKeepPlayingRef = useRef(true);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    let isActive = true;
    shouldKeepPlayingRef.current = true;
    video.muted = true;
    setIsMuted(true);

    const resumePlayback = async () => {
      if (
        !shouldKeepPlayingRef.current ||
        !video.paused ||
        video.ended
      ) {
        return;
      }

      try {
        await video.play();

        if (isActive) {
          setIsPlaying(true);
        }
      } catch {
        if (isActive) {
          setIsPlaying(false);
        }
      }
    };

    const resumeWhenActive = () => {
      if (document.visibilityState === "visible") {
        void resumePlayback();
      }
    };

    void resumePlayback();
    document.addEventListener("visibilitychange", resumeWhenActive);
    window.addEventListener("focus", resumeWhenActive);
    window.addEventListener("pageshow", resumeWhenActive);

    return () => {
      isActive = false;
      document.removeEventListener("visibilitychange", resumeWhenActive);
      window.removeEventListener("focus", resumeWhenActive);
      window.removeEventListener("pageshow", resumeWhenActive);
    };
  }, [src]);

  const togglePlayback = async () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      shouldKeepPlayingRef.current = true;

      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    shouldKeepPlayingRef.current = false;
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

  const toggleMuted = async () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = !video.muted;
    setIsMuted(video.muted);

    if (video.paused && !video.ended) {
      shouldKeepPlayingRef.current = true;

      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
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
        autoPlay
        loop={isLooping}
        muted
        ref={videoRef}
        onClick={togglePlayback}
        onEnded={() => {
          shouldKeepPlayingRef.current = false;
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
          <span>
            <Film aria-hidden="true" size={15} />
            <strong>{durationLabel}</strong>
          </span>
          <div className="video-player-actions">
            <button
              aria-label={`${isMuted ? "Unmute" : "Mute"} ${title}`}
              aria-pressed={!isMuted}
              className="video-player-option-button"
              onClick={toggleMuted}
              type="button"
            >
              {isMuted ? (
                <VolumeX aria-hidden="true" size={16} />
              ) : (
                <Volume2 aria-hidden="true" size={16} />
              )}
            </button>
            <button
              aria-label={`${isLooping ? "Disable" : "Enable"} loop for ${title}`}
              aria-pressed={isLooping}
              className="video-player-option-button"
              onClick={() => setIsLooping((current) => !current)}
              type="button"
            >
              <Repeat aria-hidden="true" size={16} />
            </button>
          </div>
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
