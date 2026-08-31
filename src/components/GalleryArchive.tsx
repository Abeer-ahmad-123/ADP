"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { GalleryPhoto } from "@/types/party";

type GalleryPhotoGroup = {
  key: string;
  photos: GalleryPhoto[];
};

function getGalleryPhotoGroups(photos: GalleryPhoto[]) {
  return Array.from(
    photos.reduce((groups, photo) => {
      const key = photo.groupKey || `photo-${photo.id}`;
      const existingGroup = groups.get(key);

      if (existingGroup) {
        existingGroup.photos.push(photo);
        return groups;
      }

      groups.set(key, {
        key,
        photos: [photo],
      });

      return groups;
    }, new Map<string, GalleryPhotoGroup>()).values(),
  ).map((group) => ({
    ...group,
    photos: [...group.photos].sort(
      (first, second) =>
        (first.groupOrder ?? 0) - (second.groupOrder ?? 0) ||
        first.id - second.id,
    ),
  }));
}

export default function GalleryArchiveView({
  photos,
}: {
  photos: GalleryPhoto[];
}) {
  const dialogTitleId = useId();
  const photoGroups = useMemo(() => getGalleryPhotoGroups(photos), [photos]);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const activeGroup =
    activeGroupIndex === null ? undefined : photoGroups[activeGroupIndex];
  const activePhoto = activeGroup?.photos[activePhotoIndex];
  const canGoPrevious = activePhotoIndex > 0;
  const canGoNext = Boolean(
    activeGroup && activePhotoIndex < activeGroup.photos.length - 1,
  );

  useEffect(() => {
    if (!activePhoto) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveGroupIndex(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePhoto]);

  function openGallery(groupIndex: number, photoIndex: number) {
    setActiveGroupIndex(groupIndex);
    setActivePhotoIndex(photoIndex);
  }

  function closeGallery() {
    setActiveGroupIndex(null);
    setActivePhotoIndex(0);
  }

  return (
    <>
      <div className="gallery-archive-grid">
        {photoGroups.map((group, groupIndex) => {
          const [leadPhoto, ...additionalPhotos] = group.photos;
          const visibleAdditionalPhotos = additionalPhotos.slice(0, 4);
          const hiddenPhotoCount =
            additionalPhotos.length - visibleAdditionalPhotos.length;
          const isPhotoGroup = group.photos.length > 1;
          const thumbnailGridClass = [
            "gallery-photo-group-grid",
            visibleAdditionalPhotos.length === 1 ? "is-single-thumb" : "",
            visibleAdditionalPhotos.length === 2 ? "is-two-thumbs" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <article
              className={`gallery-photo-card${
                isPhotoGroup ? " is-gallery-group" : ""
              }`}
              key={group.key}
            >
              {isPhotoGroup ? (
                <div className="gallery-photo-collage">
                  <div className="gallery-photo-frame gallery-photo-lead-frame">
                    <button
                      aria-label={`Open ${leadPhoto.title}`}
                      className="gallery-photo-frame-button"
                      onClick={() => openGallery(groupIndex, 0)}
                      type="button"
                    >
                      <Image
                        alt={leadPhoto.title}
                        fill
                        priority={groupIndex < 2}
                        sizes="(max-width: 760px) 62vw, (max-width: 1200px) 28vw, 260px"
                        src={leadPhoto.imageUrl}
                      />
                    </button>
                  </div>
                  <div className={thumbnailGridClass}>
                    {visibleAdditionalPhotos.map((photo, photoIndex) => {
                      const absolutePhotoIndex = photoIndex + 1;
                      const isLastVisiblePhoto =
                        photoIndex === visibleAdditionalPhotos.length - 1;

                      return (
                        <div
                          className="gallery-photo-group-thumb"
                          key={photo.id}
                        >
                          <button
                            aria-label={`Open ${photo.title}`}
                            className="gallery-photo-frame-button"
                            onClick={() =>
                              openGallery(groupIndex, absolutePhotoIndex)
                            }
                            type="button"
                          >
                            <Image
                              alt={photo.title}
                              fill
                              sizes="(max-width: 760px) 24vw, (max-width: 1200px) 10vw, 90px"
                              src={photo.imageUrl}
                            />
                            {hiddenPhotoCount > 0 && isLastVisiblePhoto && (
                              <span className="gallery-photo-more-count">
                                +{hiddenPhotoCount}
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="gallery-photo-frame">
                  <button
                    aria-label={`Open ${leadPhoto.title}`}
                    className="gallery-photo-frame-button"
                    onClick={() => openGallery(groupIndex, 0)}
                    type="button"
                  >
                    <Image
                      alt={leadPhoto.title}
                      fill
                      priority={groupIndex < 2}
                      sizes="(max-width: 760px) 92vw, (max-width: 1200px) 45vw, 360px"
                      src={leadPhoto.imageUrl}
                    />
                  </button>
                </div>
              )}
              <div className="gallery-photo-copy">
                <p>
                  <Images aria-hidden="true" size={15} />
                  Gallery · {leadPhoto.publishedAt}
                  {isPhotoGroup ? ` · ${group.photos.length} photos` : ""}
                </p>
                <h2>{leadPhoto.title}</h2>
                <span className="preserve-entered-text">
                  {leadPhoto.summary}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {activeGroup && activePhoto && (
        <div
          aria-labelledby={dialogTitleId}
          aria-modal="true"
          className="gallery-lightbox-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeGallery();
            }
          }}
          role="dialog"
        >
          <div className="gallery-lightbox">
            <div className="gallery-lightbox-topbar">
              <div>
                <p>{activePhoto.publishedAt}</p>
                <h2 id={dialogTitleId}>{activePhoto.title}</h2>
              </div>
              <button
                aria-label="Close gallery"
                className="gallery-lightbox-icon-button"
                onClick={closeGallery}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>

            <div
              className={`gallery-lightbox-stage${
                activeGroup.photos.length === 1 ? " is-single-photo" : ""
              }`}
            >
              {activeGroup.photos.length > 1 && (
                <button
                  aria-label="Previous image"
                  className="gallery-lightbox-nav is-previous"
                  disabled={!canGoPrevious}
                  onClick={() => setActivePhotoIndex((index) => index - 1)}
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" size={26} />
                </button>
              )}

              <div className="gallery-lightbox-image-frame">
                <Image
                  alt={activePhoto.title}
                  fill
                  priority
                  sizes="(max-width: 760px) 92vw, 82vw"
                  src={activePhoto.imageUrl}
                />
              </div>

              {activeGroup.photos.length > 1 && (
                <button
                  aria-label="Next image"
                  className="gallery-lightbox-nav is-next"
                  disabled={!canGoNext}
                  onClick={() => setActivePhotoIndex((index) => index + 1)}
                  type="button"
                >
                  <ChevronRight aria-hidden="true" size={26} />
                </button>
              )}
            </div>

            <div className="gallery-lightbox-footer">
              <p>{activePhoto.summary}</p>
              <span>
                {activePhotoIndex + 1} of {activeGroup.photos.length}
              </span>
            </div>

            {activeGroup.photos.length > 1 && (
              <div className="gallery-lightbox-strip" aria-hidden="true">
                {activeGroup.photos.map((photo, photoIndex) => (
                  <div
                    className={`gallery-lightbox-thumb${
                      photoIndex === activePhotoIndex ? " is-active" : ""
                    }`}
                    key={photo.id}
                  >
                    <Image
                      alt=""
                      fill
                      sizes="84px"
                      src={photo.imageUrl}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
