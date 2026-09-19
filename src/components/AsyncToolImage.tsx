/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { getToolImageUrl } from '../utils/toolHelpers';

interface AsyncToolImageProps {
  toolName: string;
  originalUrl?: string; // DB URL or previously attached URL
  className?: string;
  alt?: string;
}

// Global cache to prevent redundant API calls per session
const imageCache = new Map<string, string>();

export const AsyncToolImage: React.FC<AsyncToolImageProps> = ({ 
  toolName, 
  originalUrl, 
  className = "", 
  alt = "Asbob rasmi" 
}) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      // 1. If original URL exists and is not a generic placeholder/avatar, use it directly.
      if (originalUrl && originalUrl.length > 5 && !originalUrl.includes('images.unsplash.com/photo-1581147036324') && !originalUrl.includes('ui-avatars.com')) {
        if (isMounted) {
          setImgSrc(originalUrl);
          setLoading(false);
        }
        return;
      }

      // 2. Check local memory cache (very fast)
      const cacheKey = `img_${toolName.toLowerCase().trim()}`;
      if (imageCache.has(cacheKey)) {
        if (isMounted) {
          setImgSrc(imageCache.get(cacheKey)!);
          setLoading(false);
        }
        return;
      }

      // 3. Check persistent localStorage cache (persists across reloads)
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          imageCache.set(cacheKey, stored);
          if (isMounted) {
            setImgSrc(stored);
            setLoading(false);
          }
          return;
        }
      } catch (e) {
        // LocalStorage might be disabled
      }

      // 4. Fetch dynamically from APIs
      try {
        // --- A. Try Google Custom Search API ---
        const googleApiKey = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY;
        const googleCx = import.meta.env.VITE_GOOGLE_SEARCH_CX;
        
        if (googleApiKey && googleCx) {
          const res = await fetch(`https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(toolName + ' tool equipment')}&cx=${googleCx}&key=${googleApiKey}&searchType=image&num=1`);
          if (res.ok) {
            const data = await res.json();
            if (data.items && data.items.length > 0) {
              const link = data.items[0].link;
              imageCache.set(cacheKey, link);
              localStorage.setItem(cacheKey, link);
              if (isMounted) {
                setImgSrc(link);
                setLoading(false);
              }
              return;
            }
          }
        }

        // --- B. Try Unsplash API ---
        const unsplashKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
        if (unsplashKey) {
          const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(toolName + ' construction tool')}&per_page=1&client_id=${unsplashKey}`);
          if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              const link = data.results[0].urls.regular;
              imageCache.set(cacheKey, link);
              localStorage.setItem(cacheKey, link);
              if (isMounted) {
                setImgSrc(link);
                setLoading(false);
              }
              return;
            }
          }
        }

        // --- C. Smart Fallback (Pre-defined categories or UI Avatar) ---
        const fallback = getToolImageUrl(toolName);
        imageCache.set(cacheKey, fallback);
        localStorage.setItem(cacheKey, fallback);
        if (isMounted) {
          setImgSrc(fallback);
        }

      } catch (error) {
        console.error('Image fetch error:', error);
        // Fallback on error
        const fallback = getToolImageUrl(toolName);
        if (isMounted) {
          setImgSrc(fallback);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [toolName, originalUrl]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-slate-200 flex flex-col items-center justify-center ${className}`}>
         <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-500 animate-spin mb-1"></div>
      </div>
    );
  }

  return (
    <img 
      src={imgSrc} 
      alt={alt} 
      className={className} 
      onError={(e) => {
        // Extreme fallback if the loaded image is broken
        (e.target as HTMLImageElement).src = getToolImageUrl(toolName);
      }}
      referrerPolicy="no-referrer"
    />
  );
};
