import { useMemo } from "react";
import { useParams, Link } from "wouter";
import { useGetGrade, useGetLevels, useGetBooks, useGetSubjectsByGrade } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, BookOpen, FileText, FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookCard from "@/components/ui/BookCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Order logic for subjects
const SUBJECT_ORDER = [
  "القرآن الكريم",
  "القرآن الكريم وعلومه",
  "التربية الإسلامية",
  "اللغة العربية",
  "لغتي العربية",
  "الرياضيات",
  "الرياضيات ج1",
  "الرياضيات ج2"
];

function getSubjectSortIndex(subjectName: string | undefined): number {
  if (!subjectName) return 999;
  const index = SUBJECT_ORDER.findIndex(s => subjectName.includes(s));
  return index === -1 ? 999 : index;
}

export default function GradeBooksPage() {
  const params = useParams();
  const gradeId = Number(params.id);
  
  const { data: grade, isLoading: gradeLoading } = useGetGrade(gradeId);
  const { data: levels, isLoading: levelsLoading } = useGetLevels();
  const { data: books, isLoading: booksLoading } = useGetBooks({ gradeId });
  const { data: subjects } = useGetSubjectsByGrade(gradeId);
  
  const level = levels?.find(l => l.id === grade?.levelId);

  const subjectMap = useMemo(() => {
    const map = new Map<number, string>();
    if (subjects) {
      subjects.forEach(s => map.set(s.id, s.nameAr));
    }
    return map;
  }, [subjects]);

  const groupedBooks = useMemo(() => {
    if (!books) return { book: [], summary: [], exam: [] };
    
    // Sort books based on subject name
    const sortedBooks = [...books].sort((a, b) => {
      const subjA = subjectMap.get(a.subjectId);
      const subjB = subjectMap.get(b.subjectId);
      const orderA = getSubjectSortIndex(subjA);
      const orderB = getSubjectSortIndex(subjB);
      
      if (orderA !== orderB) return orderA - orderB;
      return (subjA || "").localeCompare(subjB || "");
    });

    return {
      book: sortedBooks.filter(b => b.type === "book"),
      summary: sortedBooks.filter(b => b.type === "summary"),
      exam: sortedBooks.filter(b => b.type === "exam")
    };
  }, [books, subjectMap]);

  return (
    <div className="space-y-12">
      <Breadcrumb dir="rtl">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">الرئيسية</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronLeft className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            {levelsLoading || gradeLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <BreadcrumbLink asChild>
                <Link href={`/level/${level?.id}`}>{level?.nameAr}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronLeft className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            {gradeLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <BreadcrumbLink asChild>
                <Link href={`/grade/${grade?.id}`}>{grade?.nameAr}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronLeft className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>جميع الكتب والمراجع</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="pb-4 border-b flex items-center justify-between gap-4 flex-wrap">
        {gradeLoading ? (
          <Skeleton className="h-10 w-64 mb-2" />
        ) : (
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="text-primary" />
            <span>محتوى {grade?.nameAr}</span>
          </h1>
        )}
        {!gradeLoading && (
          <Link href={`/grade/${gradeId}/upload`}>
            <Button variant="outline" className="gap-2 rounded-xl border-primary text-primary hover:bg-primary hover:text-white">
              <Upload size={18} />
              <span>رفع كتاب جديد</span>
            </Button>
          </Link>
        )}
      </div>

      {booksLoading ? (
        <div className="space-y-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-64 rounded-2xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-16">
          <BookSection 
            title="كتب المنهج" 
            icon={<BookOpen size={24} className="text-blue-500" />}
            books={groupedBooks.book} 
            emptyMessage="لا توجد كتب منهج مضافة لهذا الصف بعد"
          />
          
          <BookSection 
            title="الملخصات والمذكرات" 
            icon={<FileText size={24} className="text-emerald-500" />}
            books={groupedBooks.summary} 
            emptyMessage="لا توجد ملخصات مضافة لهذا الصف بعد"
          />
          
          <BookSection 
            title="نماذج الاختبارات" 
            icon={<FileSpreadsheet size={24} className="text-orange-500" />}
            books={groupedBooks.exam} 
            emptyMessage="لا توجد نماذج اختبارات مضافة لهذا الصف بعد"
          />
        </div>
      )}
    </div>
  );
}

function BookSection({ title, icon, books, emptyMessage }: { title: string, icon: React.ReactNode, books: any[], emptyMessage: string }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        {icon}
        <span>{title}</span>
        <span className="text-sm font-normal text-muted-foreground mr-2 bg-muted px-2 py-0.5 rounded-full">
          {books.length}
        </span>
      </h2>
      
      {books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {books.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground bg-card border rounded-2xl border-dashed">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}
