export interface TranscriptListItem {
  title: string;
  displayTitle?: string;
  category?: string;
  preview: string;
  summary?: string;
  youtube?: string;
}

export interface MainChannelListItem extends TranscriptListItem {
  guest?: string;
  image?: string;
}

export interface HoveredPodcast {
  speaker: string | null;
  topic: string;
  initials: string;
  summary?: string;
}

export interface ParsedPodcastTitle {
  speaker: string | null;
  topic: string;
  initials: string;
}
