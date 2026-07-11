/* Media preview — renders img/gif/video based on media_type */
import { useState, useRef } from 'react';
import { IconPlay } from './icons';
import './media-preview.css';

/**
 * Renders the appropriate media element.
 * @param {string} src - Media URL
 * @param {string} mediaType - 'image' | 'gif' | 'video'
 * @param {string} alt - Alt text
 * @param {string} mode - 'thumbnail' (cover) or 'full' (contain)
 * @param {string} className - Extra class names
 */
export default function MediaPreview({ src, mediaType, alt = '', mode = 'thumbnail', className = '' }) {
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef(null);

  const fitClass = mode === 'thumbnail' ? 'media-preview--cover' : 'media-preview--contain';

  const handleMouseEnter = () => {
    if (mediaType === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (mediaType === 'video' && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      className={`media-preview ${fitClass} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Skeleton loader */}
      {!loaded && <div className="media-preview__skeleton skeleton" />}

      {mediaType === 'video' ? (
        <>
          <video
            ref={videoRef}
            src={src}
            muted
            loop
            playsInline
            preload="metadata"
            className={`media-preview__element ${loaded ? 'is-loaded' : ''}`}
            onLoadedData={() => setLoaded(true)}
          />
          {/* Play icon overlay for thumbnails */}
          {mode === 'thumbnail' && loaded && (
            <div className="media-preview__play-overlay">
              <IconPlay size={32} color="#FFFFFF" />
            </div>
          )}
        </>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={mode === 'thumbnail' ? 'lazy' : 'eager'}
          className={`media-preview__element ${loaded ? 'is-loaded' : ''}`}
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  );
}
