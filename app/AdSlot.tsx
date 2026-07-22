import { Advertisement } from "../lib/ads";

export function InFeedAdSlot({ ad }: { ad: Advertisement | null }) {
  if (!ad) return null;
  return (
    <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer sponsored" className="adSlot adSlotInFeed">
      <img src={ad.imageUrl} alt={ad.companyName} className="realPhoto" />
      <span className="adLabel">PR ／ {ad.companyName}</span>
    </a>
  );
}

export function SidebarAdSlot({ ad }: { ad: Advertisement | null }) {
  if (!ad) return null;
  return (
    <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer sponsored" className="adSlot adSlotSidebar">
      <img src={ad.imageUrl} alt={ad.companyName} className="realPhoto" />
      <span className="adLabel">PR ／ {ad.companyName}</span>
    </a>
  );
}
