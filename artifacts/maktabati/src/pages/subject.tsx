import { useParams, Link } from "wouter";
import { useGetSubject, useGetGrade, useGetLevels, useGetBooksBySubject } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import BookCard from "@/components/ui/BookCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function SubjectPage() {
  const params = useParams();
  const subjectId = Number(params.id);
  
  const { data: subject, isLoading: subjectLoading } = useGetSubject(subjectId);
  const { data: grade, isLoading: gradeLoading } = useGetGrade(subject?.gradeId || 0, { query: { enabled: !!subject?.gradeId } });
  const { data: levels, isLoading: levelsLoading } = useGetLevels();
  const { data: books, isLoading: booksLoading } = useGetBooksBySubject(subjectId);
  
  const level = levels?.find(l => l.id === grade?.levelId);

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
            ) : level ? (
              <BreadcrumbLink asChild>
                <Link href={`/level/${level.id}`}>{level.nameAr}</Link>
              </BreadcrumbLink>
            ) : null}
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronLeft className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            {gradeLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : grade ? (
              <BreadcrumbLink asChild>
                <Link href={`/grade/${grade.id}`}>{grade.nameAr}</Link>
              </BreadcrumbLink>
            ) : null}
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronLeft className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            {subjectLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <BreadcrumbPage>{subject?.nameAr}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 border-b pb-6">
        {subjectLoading ? (
          <Skeleton className="h-16 w-16 rounded-2xl" />
        ) : (
          <div 
            className="text-4xl p-4 bg-card rounded-2xl border shadow-sm" 
            style={{ color: subject?.color || "var(--primary)" }}
          >
            {subject?.icon}
          </div>
        )}
        
        <div>
          {subjectLoading ? (
            <Skeleton className="h-10 w-48 mb-2" />
          ) : (
            <h1 className="text-3xl font-bold">{subject?.nameAr}</h1>
          )}
          <p className="text-muted-foreground mt-1">
            {gradeLoading ? <Skeleton className="h-4 w-32" /> : grade?.nameAr}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">المحتوى التعليمي</h2>
          {!booksLoading && books && (
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
              {books.length} عناصر
            </span>
          )}
        </div>
        
        {booksLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : books && books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {books.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground bg-card border rounded-2xl border-dashed">
            لا يوجد محتوى مضاف لهذه المادة بعد
          </div>
        )}
      </div>
    </div>
  );
}
