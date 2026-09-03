import { INITIAL_COMMUNITY_FEED, SeedExperience } from '../data/seedFeed';

// Shared in-memory feed store (used by the feed endpoints and the platform's feed-clip flow)
export const feedStore: SeedExperience[] = [...INITIAL_COMMUNITY_FEED];

export function addFeedExperience(item: SeedExperience): SeedExperience {
  feedStore.unshift(item);
  return item;
}

export function findFeedExperience(id: string): SeedExperience | undefined {
  return feedStore.find((i) => i.id === id);
}

// ---- Votes & comments (community engagement) --------------------------------

export interface FeedComment {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
}

const votes: Record<string, { up: number; down: number }> = {};
const comments: Record<string, FeedComment[]> = {};

export function voteFeedExperience(id: string, dir: 1 | -1): { up: number; down: number; net: number } {
  const v = votes[id] || { up: 0, down: 0 };
  if (dir === 1) v.up += 1;
  if (dir === -1) v.down += 1;
  votes[id] = v;
  return { ...v, net: v.up - v.down };
}

export function getFeedEngagement(id: string) {
  const v = votes[id] || { up: 0, down: 0 };
  return { up: v.up, down: v.down, net: v.up - v.down, commentCount: comments[id]?.length || 0 };
}

export function addFeedComment(id: string, authorName: string, text: string): FeedComment {
  const list = comments[id] || [];
  const comment: FeedComment = {
    id: `c-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    authorName,
    text,
    createdAt: new Date().toISOString(),
  };
  list.unshift(comment);
  comments[id] = list;
  return comment;
}

export function getFeedComments(id: string): FeedComment[] {
  return comments[id] || [];
}
