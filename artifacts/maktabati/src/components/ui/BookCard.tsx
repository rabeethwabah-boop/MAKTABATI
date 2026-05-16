import { Book } from "@workspace/api-client-react/src/generated/api.schemas";
import { Download, BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const downloadUrl = `/api/books/${book.id}/download`;

  return (
    <div className="group relative flex flex-col bg-card rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300">
      <div
        className="w-full aspect-[3/4] relative overflow-hidden flex items-center justify-center border-b"
        style={{ backgroundColor: book.coverColor || "hsl(var(--muted))" }}
      >
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
            <FileText size={48} className="mb-2" />
            <span className="text-xs font-medium">لا توجد صورة</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>

      <div className="p-3 flex flex-col flex-1 gap-3">
        <h3
          className="font-bold text-sm leading-snug text-foreground line-clamp-3"
          title={book.title}
        >
          {book.title}
        </h3>

        <div className="mt-auto flex flex-col gap-2">
          {book.downloadUrl ? (
            <>
              <Link href={`/book/${book.id}`} asChild>
                <Button className="w-full gap-2 rounded-xl" variant="default" size="sm">
                  <BookOpen size={15} />
                  <span>فتح</span>
                </Button>
              </Link>
              <a href={downloadUrl} download className="w-full">
                <Button className="w-full gap-2 rounded-xl" variant="outline" size="sm">
                  <Download size={15} />
                  <span>تحميل</span>
                </Button>
              </a>
            </>
          ) : (
            <Button className="w-full gap-2 rounded-xl" variant="outline" disabled size="sm">
              <span>غير متوفر حالياً</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
