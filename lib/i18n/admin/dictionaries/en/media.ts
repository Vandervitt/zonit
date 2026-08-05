// 素材库页与共享的媒体组件（MediaGrid / UploadZone / UnsplashModal）。
export const media = {
  title: "Media",
  count: (n: number) => `${n} items`,
  loadErrorLabel: "the media library",
  filter: { all: "All", image: "Images", video: "Videos" },
  empty: "No media yet",
  emptyHint: "No media yet — hit Upload to add some",

  upload: { button: "Upload", uploading: "Uploading…", failed: "Upload failed. Please try again." },
  deleteConfirm: {
    title: (filename: string) => `Delete “${filename}”?`,
    ok: "Delete",
    cancel: "Cancel",
  },

  unsplash: {
    open: "Add from Unsplash",
    title: "Add from Unsplash",
    searchPlaceholder: "Search Unsplash (English works best)",
    searchButton: "Search",
    searchAria: "Search Unsplash images",
    notConfigured: "Unsplash isn't configured — contact your administrator",
    searchFailed: "Search failed. Please try again.",
    prompt: "Enter a keyword to search for images",
    addAria: (author: string) => `Add Unsplash image by ${author}`,
    adding: "Adding…",
    added: "Added to your media library",
    addFailed: "Could not add the image",
  },
};
