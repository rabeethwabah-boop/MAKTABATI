import { useParams, Link } from "wouter";
import { useGetBook } from "@workspace/api-client-react";
import { ArrowRight, Download, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BookViewerPage() {
  const params = useParams();
  const bookId = Number(params.id);
  const { data: book, isLoading, isError } = useGetBook(bookId);

  const viewUrl = `/api/books/${bookId}/view`;
  const downloadUrl = `/api/books/${bookId}/download`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" dir="rtl">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shadow-sm shrink-0">
        <Link href={`/grade/${book?.gradeId}/books`} asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowRight size={20} />
          </Button>
        </Link>

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="h-5 w-48 bg-muted animate-pulse rounded" />
          ) : (
            <h1 className="font-bold text-base truncate">{book?.title}</h1>
          )}
        </div>

        {book?.downloadUrl && (
          <a href={downloadUrl} download>
            <Button variant="default" size="sm" className="gap-2 shrink-0">
              <Download size={16} />
              <span className="hidden sm:inline">تحميل</span>
            </Button>
          </a>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        )}
        {isError && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
            <AlertTriangle size={40} className="text-destructive" />
            <p className="font-medium">تعذّر تحميل الكتاب</p>
          </div>
        )}
        {!isLoading && !isError && book?.downloadUrl && (
          <iframe
            src={viewUrl}
            className="w-full h-full border-0"
            title={book.title}
            allow="fullscreen"
          />
        )}
        {!isLoading && !isError && !book?.downloadUrl && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
            <AlertTriangle size={40} />
            <p className="font-medium">الكتاب غير متوفر حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}
