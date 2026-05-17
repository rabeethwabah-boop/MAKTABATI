import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  useGetBooks,
  useGetLevels,
  useGetGrades,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import {
  Trash2,
  Upload,
  BookOpen,
  Search,
  FileText,
  FileSpreadsheet,
  LayoutDashboard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TYPE_LABEL: Record<string, string> = {
  book: "كتاب المنهج",
  summary: "ملخص",
  exam: "اختبار",
};
const TYPE_COLOR: Record<string, string> = {
  book: "bg-blue-100 text-blue-700",
  summary: "bg-green-100 text-green-700",
  exam: "bg-orange-100 text-orange-700",
};

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: books, isLoading: booksLoading } = useGetBooks();
  const { data: levels } = useGetLevels();
  const { data: grades } = useGetGrades();

  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const gradeMap = useMemo(
    () => Object.fromEntries((grades ?? []).map((g) => [g.id, g.nameAr])),
    [grades]
  );

  const filtered = useMemo(() => {
    return (books ?? []).filter((b) => {
      if (filterGrade !== "all" && String(b.gradeId) !== filterGrade) return false;
      if (filterType !== "all" && b.type !== filterType) return false;
      if (search && !b.title.includes(search)) return false;
      return true;
    });
  }, [books, filterGrade, filterType, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/books/${deleteId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error();
      await queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({ title: "تم حذف الكتاب" });
    } catch {
      toast({ title: "فشل الحذف", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const stats = useMemo(() => {
    const all = books ?? [];
    return {
      total: all.length,
      books: all.filter((b) => b.type === "book").length,
      summaries: all.filter((b) => b.type === "summary").length,
      exams: all.filter((b) => b.type === "exam").length,
    };
  }, [books]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <LayoutDashboard className="text-primary" />
          لوحة الإدارة
        </h1>
        <Link href="/grade/1/upload">
          <Button className="gap-2 rounded-xl">
            <Upload size={18} />
            رفع كتاب جديد
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الملفات", value: stats.total, icon: BookOpen, color: "text-primary" },
          { label: "كتب المنهج", value: stats.books, icon: BookOpen, color: "text-blue-600" },
          { label: "ملخصات", value: stats.summaries, icon: FileText, color: "text-green-600" },
          { label: "اختبارات", value: stats.exams, icon: FileSpreadsheet, color: "text-orange-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className={`p-2 rounded-xl bg-muted ${color}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold">{booksLoading ? "—" : value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload shortcuts by grade */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-lg mb-3">رفع سريع حسب الصف</h2>
        <div className="flex flex-wrap gap-2">
          {(grades ?? []).map((g) => (
            <Link key={g.id} href={`/grade/${g.id}/upload`}>
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1">
                <Upload size={13} />
                {g.nameAr}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            className="pr-9 text-right"
            placeholder="ابحث بالعنوان..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterGrade} onValueChange={setFilterGrade} dir="rtl">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="كل الصفوف" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الصفوف</SelectItem>
            {(grades ?? []).map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>{g.nameAr}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType} dir="rtl">
          <SelectTrigger className="w-36">
            <SelectValue placeholder="كل الأنواع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem>
            <SelectItem value="book">كتاب المنهج</SelectItem>
            <SelectItem value="summary">ملخص</SelectItem>
            <SelectItem value="exam">اختبار</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} نتيجة</span>
      </div>

      {/* Books table */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        {booksLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
            <p>لا توجد كتب تطابق البحث</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-right py-3 px-4 font-bold">العنوان</th>
                  <th className="text-right py-3 px-4 font-bold">الصف</th>
                  <th className="text-right py-3 px-4 font-bold">النوع</th>
                  <th className="text-right py-3 px-4 font-bold">الرابط</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((book, i) => (
                  <tr key={book.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="py-3 px-4 font-medium max-w-xs truncate">{book.title}</td>
                    <td className="py-3 px-4 text-muted-foreground">{gradeMap[book.gradeId] ?? `صف ${book.gradeId}`}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLOR[book.type] ?? "bg-gray-100 text-gray-700"}`}>
                        {TYPE_LABEL[book.type] ?? book.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {book.downloadUrl ? (
                        <a href={book.downloadUrl} target="_blank" rel="noreferrer"
                          className="text-primary hover:underline text-xs flex items-center gap-1">
                          <FileText size={13} /> فتح الملف
                        </a>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="ghost" size="icon"
                        className="text-destructive hover:bg-destructive/10 rounded-lg h-8 w-8"
                        onClick={() => setDeleteId(book.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الكتاب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الكتاب؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}>
              {deleting ? "جارٍ الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
