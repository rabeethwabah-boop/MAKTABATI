import { Book } from "@workspace/api-client-react/src/generated/api.schemas";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
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
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 text-foreground">
            <FileText size={48} className="mb-2" />
            <span className="text-sm font-semibold opacity-70">صورة غير متوفرة</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>
      
      <div className="p-4 flex flex-col flex-1 gap-4">
        <h3 className="font-bold text-base leading-tight text-foreground line-clamp-2" title={book.title}>
          {book.title}
        </h3>
        
        <div className="mt-auto">
          {book.downloadUrl ? (
            <Button 
              className="w-full gap-2 rounded-xl"
              variant="default"
              onClick={() => window.open(book.downloadUrl!, "_blank")}
            >
              <Download size={18} />
              <span>تحميل</span>
            </Button>
          ) : (
            <Button 
              className="w-full gap-2 rounded-xl" 
              variant="outline" 
              disabled
            >
              <span>غير متوفر حالياً</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
