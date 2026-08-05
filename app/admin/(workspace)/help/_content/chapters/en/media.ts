import type { HelpChapterData } from "../../types";

export const media: HelpChapterData = {
  slug: "media",
  title: "Media library",
  summary: "Uploading images, importing from Unsplash, and the rules on using assets.",
  sections: [
    {
      id: "manage",
      heading: "Managing assets",
      blocks: [
        {
          t: "list",
          items: [
            "The media library holds every image you've uploaded. Any image slot in the editor can pick from it, so you upload once and reuse everywhere.",
            "Uploading your own: hit Upload and choose a file. JPG / PNG / WebP work best; keep each image under 1 MB so pages stay fast (load speed feeds straight into ad quality scores and conversion rate).",
            "From Unsplash: hit “Add from Unsplash” and search in English (“dental clinic”, “skincare”). What you pick is saved to your library.",
          ],
        },
      ],
    },
    {
      id: "copyright",
      heading: "Rights and usage",
      blocks: [
        {
          t: "list",
          items: [
            "Unsplash images are free for commercial use, and attribution is handled automatically on import — nothing for you to add.",
            "For your own uploads, make sure you hold the rights: customer imagery (before/after shots, reviewer avatars) needs the person's consent.",
            "Don't upload anything featuring someone else's trademark, a celebrity likeness, or a competitor's material — that's what triggers ad review problems.",
          ],
        },
      ],
    },
  ],
};
