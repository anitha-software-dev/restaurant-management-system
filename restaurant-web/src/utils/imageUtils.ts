import Config from '../configs/config.json';
import defaultFoodPlaceholder from '../assets/images/food-placeholder.jpg';
import thumbnailPlaceholder from '../assets/images/fsr-placeholder.png';
import { Items } from '../types/shopType';

/**
 * Safely decodes a URI component without throwing errors on malformed input.
 */
function safeDecode(val: string): string {
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

/**
 * Converts a raw image reference (filename, relative path, or full URL)
 * into a valid, fully qualified Firebase Storage URL or web URL.
 * If the input is empty or invalid, returns the fallback image.
 */
export function getFirebaseImageUrl(
  rawImage: unknown,
  fallback: string = defaultFoodPlaceholder
): string {
  if (!rawImage || typeof rawImage !== 'string') {
    return fallback;
  }

  let trimmed = rawImage.trim();
  if (!trimmed) {
    return fallback;
  }

  // Already a full web URL, data URI, or blob URI
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    // If it's a Firebase Storage URL without alt=media, ensure alt=media is present
    if (
      trimmed.includes('firebasestorage.googleapis.com') &&
      !trimmed.includes('alt=media')
    ) {
      trimmed += trimmed.includes('?') ? '&alt=media' : '?alt=media';
    }
    return trimmed;
  }

  // Normalize path: decode first to avoid double encoding, strip leading slashes
  let cleaned = safeDecode(trimmed).replace(/^\/+/, '');

  // If path already starts with images/ or images%2F (case-insensitive), strip it
  // because Config.MEDIA_URL already points to /o/images%2F
  if (cleaned.toLowerCase().startsWith('images/')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.toLowerCase().startsWith('images%2f')) {
    cleaned = cleaned.slice(9);
  }

  if (!cleaned) {
    return fallback;
  }

  const mediaUrlBase =
    Config.MEDIA_URL ||
    'https://firebasestorage.googleapis.com/v0/b/restaurant-56c7a.firebasestorage.app/o/images%2F';

  // Ensure base has proper delimiter (%2F or /) without appending extra slash
  let base = mediaUrlBase;
  if (!base.endsWith('/') && !base.endsWith('%2F') && !base.endsWith('%2f')) {
    base = `${base}/`;
  }

  // Encode the filename component
  const encodedName = encodeURIComponent(cleaned);

  // Append alt=media query parameter
  return `${base}${encodedName}?alt=media`;
}

/**
 * Resolves the primary image URL for a menu item.
 * Supports item.images (array or string), item.image, item.imageUrl, etc.
 * Falls back to defaultFoodPlaceholder if no valid image is found.
 */
export function getItemImageUrl(
  item: Items | any | null | undefined,
  fallback: string = defaultFoodPlaceholder
): string {
  if (!item) {
    return fallback;
  }

  let candidate: string | null = null;

  // 1. Check item.images array
  if (Array.isArray(item.images) && item.images.length > 0) {
    for (const img of item.images) {
      if (typeof img === 'string' && img.trim()) {
        candidate = img.trim();
        break;
      }
    }
  } else if (typeof item.images === 'string' && item.images.trim()) {
    // Some legacy or newly added items may have images as a comma-separated string or single filename
    const first = item.images.split(',')[0].trim();
    if (first) {
      candidate = first;
    }
  }

  // 2. Check item.image fallback
  if (!candidate && typeof item.image === 'string' && item.image.trim()) {
    candidate = item.image.trim();
  }

  // 3. Check item.imageUrl fallback
  if (!candidate && typeof item.imageUrl === 'string' && item.imageUrl.trim()) {
    candidate = item.imageUrl.trim();
  }

  if (!candidate) {
    return fallback;
  }

  return getFirebaseImageUrl(candidate, fallback);
}

export interface GalleryImageItem {
  original: string;
  thumbnail: string;
  onErrorImageURL: string;
  originalHeight: number;
}

/**
 * Resolves all images for a menu item for gallery display.
 * Returns an array formatted for react-image-gallery.
 */
export function getItemGalleryImages(
  item: Items | any | null | undefined,
  fallback: string = defaultFoodPlaceholder
): GalleryImageItem[] {
  if (!item) {
    return [
      {
        original: fallback,
        thumbnail: thumbnailPlaceholder || fallback,
        onErrorImageURL: fallback,
        originalHeight: 300,
      },
    ];
  }

  const rawImages: string[] = [];

  // Extract from item.images array
  if (Array.isArray(item.images)) {
    for (const img of item.images) {
      if (typeof img === 'string' && img.trim()) {
        const val = img.trim();
        if (!rawImages.includes(val)) {
          rawImages.push(val);
        }
      }
    }
  } else if (typeof item.images === 'string' && item.images.trim()) {
    const parts = item.images.split(',');
    for (const part of parts) {
      const val = part.trim();
      if (val && !rawImages.includes(val)) {
        rawImages.push(val);
      }
    }
  }

  // Extract from item.image
  if (typeof item.image === 'string' && item.image.trim()) {
    const val = item.image.trim();
    if (!rawImages.includes(val)) {
      rawImages.push(val);
    }
  }

  if (rawImages.length === 0) {
    return [
      {
        original: fallback,
        thumbnail: thumbnailPlaceholder || fallback,
        onErrorImageURL: fallback,
        originalHeight: 300,
      },
    ];
  }

  return rawImages.map((raw) => {
    const url = getFirebaseImageUrl(raw, fallback);
    return {
      original: url,
      thumbnail: url,
      onErrorImageURL: fallback,
      originalHeight: 300,
    };
  });
}

/**
 * Safe image onError handler that switches the broken image source
 * to a fallback placeholder and clears the error handler to prevent loops.
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback: string = defaultFoodPlaceholder
): void {
  const target = e.currentTarget;
  if (target && target.src !== fallback) {
    target.onerror = null;
    target.src = fallback;
  }
}

export { defaultFoodPlaceholder, thumbnailPlaceholder };
