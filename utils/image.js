const FALLBACK_IMAGE =
  "https://placehold.co/900x600/eaf2ff/1e3a8a?text=Tech Digital Designers";

export function getImageUrl(item) {
  if (!item) {
    return FALLBACK_IMAGE;
  }

  if (item.imageUrl) {
    return item.imageUrl;
  }

  if (item.image) {
    return item.image;
  }

  if (item.imageKey && import.meta.env.VITE_AWS_PUBLIC_BASE_URL) {
    return `${import.meta.env.VITE_AWS_PUBLIC_BASE_URL}/${item.imageKey}`;
  }

  return FALLBACK_IMAGE;
}

export function handleImageError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_IMAGE;
}