import Image from 'next/image';
import { Card } from './ui/card';

export function MasonryGallery({ items }: { items: Array<{ mediaType: 'image' | 'video'; url: string; thumbnailUrl?: string; title: string; caption?: string }> }) {
  return (
    <div className="columns-1 gap-4 space-y-4 sm:columns-2 xl:columns-3">
      {items.map((item) => (
        <Card key={item.url} className="break-inside-avoid overflow-hidden p-0">
          {item.mediaType === 'video' ? (
            <video controls className="h-auto w-full object-cover">
              <source src={item.url} />
            </video>
          ) : (
            <div className="relative aspect-[4/3] w-full">
              <Image src={item.url} alt={item.title} fill className="object-cover" />
            </div>
          )}
          <div className="p-4">
            <h3 className="font-bold">{item.title}</h3>
            {item.caption ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.caption}</p> : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
