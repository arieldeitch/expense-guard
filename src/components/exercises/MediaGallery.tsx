/**
 * MediaGallery — הצגת מדיה של תרגיל.
 * מדיה מאומתת בלבד מוצגת כהדרכה מוסמכת; היתר מסומן. אין autoplay עם קול.
 * אם אין מדיה — placeholder + קריאה להוספה עתידית.
 */
import { AlertTriangle, ImageOff, PlayCircle } from "lucide-react";
import {
  MEDIA_TYPE_LABEL,
  VERIFICATION_LABEL,
  VERIFICATION_TONE,
  type ExerciseMedia,
} from "@/lib/exercises";
import { Chip } from "@/components/catalog/shared";

export function MediaGallery({ media }: { media: ExerciseMedia[] }) {
  if (media.length === 0) return <MediaPlaceholder />;

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {media.map((m) => (
        <li key={m.id}>
          <MediaItem media={m} />
        </li>
      ))}
    </ul>
  );
}

function MediaItem({ media }: { media: ExerciseMedia }) {
  const tone = VERIFICATION_TONE[media.verification_status];
  const isUnsafe = media.verification_status === "not_licensed";

  return (
    <figure className="tile-base overflow-hidden">
      <div className="aspect-video w-full bg-tint">
        {isUnsafe ? (
          <div className="grid h-full w-full place-items-center gap-2 text-center text-muted-foreground">
            <AlertTriangle aria-hidden className="size-6 text-warning" />
            <p className="text-xs font-semibold">מדיה לא מאושרת — לא מוצגת</p>
          </div>
        ) : media.media_type === "video" ? (
          <video
            src={media.url}
            controls
            muted
            preload="metadata"
            poster={media.thumbnail_url ?? undefined}
            className="h-full w-full object-cover"
          >
            {media.captions ? <track kind="captions" srcLang="he" label="עברית" /> : null}
          </video>
        ) : media.thumbnail_url || media.url ? (
          <img
            src={media.thumbnail_url ?? media.url}
            alt={media.alt_text ?? ""}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <ImageOff aria-hidden className="size-6 text-muted-foreground" />
          </div>
        )}
      </div>
      <figcaption className="flex flex-col gap-1 p-3">
        <div className="flex items-center gap-1.5 text-sm font-bold">
          {media.title ?? MEDIA_TYPE_LABEL[media.media_type]}
          {media.media_type === "video" ? (
            <PlayCircle aria-hidden className="size-3.5 text-info" />
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip>{MEDIA_TYPE_LABEL[media.media_type]}</Chip>
          <Chip
            tone={
              tone === "success"
                ? "success"
                : tone === "warning"
                  ? "warning"
                  : tone === "info"
                    ? "info"
                    : tone === "destructive"
                      ? "destructive"
                      : "default"
            }
          >
            {VERIFICATION_LABEL[media.verification_status]}
          </Chip>
          {media.attribution ? <Chip>{media.attribution}</Chip> : null}
        </div>
        {media.description ? (
          <p className="text-xs text-muted-foreground">{media.description}</p>
        ) : null}
        {media.source_url ? (
          <a
            href={media.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-info hover:underline"
          >
            מקור
          </a>
        ) : null}
      </figcaption>
    </figure>
  );
}

function MediaPlaceholder() {
  return (
    <div className="tile-base flex flex-col gap-2 p-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-tint text-muted-foreground">
          <ImageOff aria-hidden className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold">אין עדיין מדיה</div>
          <p className="text-xs text-muted-foreground">
            כאשר יחובר אחסון בטוח, ניתן יהיה להעלות תמונות או סרטונים. עד אז, שימוש בהוראות
            הטכניקה למטה.
          </p>
        </div>
      </div>
    </div>
  );
}
