export type Advertisement = {
  id: string;
  imageUrl: string;
  companyName: string;
  linkUrl: string;
  startsAt: string;
  endsAt: string;
};

// No advertisements table exists yet. Once one does, replace these bodies
// with a query for the row where startsAt <= now <= endsAt (per placement),
// ordered by created_at. Callers already treat "no ad" (null) as the normal
// case, so wiring in a real query later needs no changes anywhere else.
export async function getActiveInFeedAd(): Promise<Advertisement | null> {
  return null;
}

export async function getActiveSidebarAd(): Promise<Advertisement | null> {
  return null;
}
