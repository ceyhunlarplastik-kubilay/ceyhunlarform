"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Upload,
  X,
  Search,
  Filter,
  XCircle,
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { motion, AnimatePresence } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface Product {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  slug?: string;
}

interface Assignment {
  sectorId: string;
  productionGroupId: string;
}

interface Sector {
  _id: string;
  name: string;
}

interface ProductionGroup {
  groupId: string;
  name: string;
}

/* -------------------------------------------------------------------------- */
/*                                  FETCHERS                                  */
/* -------------------------------------------------------------------------- */

/* async function fetchProducts(
  search: string,
  sectorId: string,
  productionGroupId: string
): Promise<Product[]> {
  const params: any = {};
  if (search) params.search = search;
  if (sectorId && sectorId !== "all") params.sectorId = sectorId;
  if (productionGroupId && productionGroupId !== "all")
    params.productionGroupId = productionGroupId;

  const { data } = await axios.get<Product[]>("/api/products", { params });
  return data;
} */

const PAGE_SIZE = 20;

type ProductsResponse = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
};

async function fetchProducts(params: {
  search: string;
  sectorId: string;
  productionGroupId: string;
  page: number;
  limit: number;
}): Promise<ProductsResponse> {
  const query: any = {
    page: params.page,
    limit: params.limit,
  };

  if (params.search) query.search = params.search;
  if (params.sectorId !== "all") query.sectorId = params.sectorId;
  if (params.productionGroupId !== "all")
    query.productionGroupId = params.productionGroupId;

  const { data } = await axios.get("/api/products", { params: query });
  return data;
}

async function fetchSectors(): Promise<Sector[]> {
  const { data } = await axios.get<Sector[]>("/api/catalog/sectors");
  return data;
}

async function fetchGroups(
  sectorId: string
): Promise<{ groups: ProductionGroup[] }> {
  if (!sectorId || sectorId === "all") return { groups: [] };
  const { data } = await axios.get<{ groups: ProductionGroup[] }>(
    "/api/catalog/options",
    { params: { sectorId } }
  );
  return data;
}

async function fetchProductAssignments(productId: string) {
  const { data } = await axios.get("/api/productAssignments", {
    params: { productId },
  });
  return data;
}

/* -------------------------------------------------------------------------- */
/*                                 FORM TYPE                                  */
/* -------------------------------------------------------------------------- */

type ProductFormValues = {
  name: string;
  description: string;
  imageUrl: string;
  assignments: Assignment[];
};

export default function ProductsAdminPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FILTERS STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [selectedSector, setSelectedSector] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");

  // --- MODAL & FORM STATE ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // --- IMAGE UPLOAD STATE ---
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [removeImageFlag, setRemoveImageFlag] = useState(false);

  // --- PAGINATION STATE ---
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);

  // --- RHF SETUP ---
  const form = useForm<ProductFormValues>({
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      assignments: [{ sectorId: "", productionGroupId: "" }],
    },
  });

  const { register, handleSubmit, reset, setValue, watch, control } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "assignments",
  });

  // Clean up preview blob URLs
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  /* ---------------------------- DATA FETCHING ---------------------------- */

  // 1. Fetch SECTORS first (needed for filters)
  const { data: sectors = [] } = useQuery({
    queryKey: ["sectors"],
    queryFn: fetchSectors,
  });

  // 2. Fetch GROUPS for filter (dependent on selectedSector)
  const { data: filterGroupsData } = useQuery({
    queryKey: ["filterGroups", selectedSector],
    queryFn: () => fetchGroups(selectedSector),
    enabled: selectedSector !== "all",
  });
  const filterGroups = filterGroupsData?.groups || [];

  // Reset group filter if sector changes
  useEffect(() => {
    setSelectedGroup("all");
  }, [selectedSector]);

  // 3. Fetch PRODUCTS (dependent on filters)
  const { data, isLoading } = useQuery({
    queryKey: [
      "products",
      debouncedSearch,
      selectedSector,
      selectedGroup,
      page,
    ],
    queryFn: () =>
      fetchProducts({
        search: debouncedSearch,
        sectorId: selectedSector,
        productionGroupId: selectedGroup,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const products = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const productsLoading = isLoading;

  /* --------------------------- MUTATIONS --------------------------- */

  // Note: createMutation is mostly used for "New Product" without image
  // or as part of the flow. We'll simplify the usage in onSubmit.
  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      description: string;
      imageUrl: string;
      assignments: Assignment[];
    }) => {
      const { data } = await axios.post("/api/products", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Ürün başarıyla oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeDialogAndReset();
    },
    onError: (e: any) => {
      const msg = e.response?.data?.error || e.message;
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      productId: string;
      name: string;
      description: string;
      imageUrl: string;
      assignments: Assignment[];
    }) => {
      const { data } = await axios.put("/api/products", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Ürün başarıyla güncellendi");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeDialogAndReset();
    },
    onError: (e: any) => {
      const msg = e.response?.data?.error || e.message;
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (product: Product) => {
      // 1) S3 görsel sil (varsa)
      if (product.imageUrl) {
        await axios
          .delete("/api/products/upload", {
            params: { url: product.imageUrl },
          })
          .catch(() => {});
      }
      // 2) Product sil
      const { data } = await axios.delete("/api/products", {
        params: { productId: product._id },
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Ürün silindi");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeletingProduct(null);
    },
    onError: (e: any) => {
      const msg = e.response?.data?.error || "Silme işlemi başarısız";
      toast.error(msg);
    },
  });

  /* --------------------------- HELPERS --------------------------- */

  const isDialogOpen = isCreateOpen || !!editingProduct;
  const isPending =
    uploading || createMutation.isPending || updateMutation.isPending;

  const closeDialogAndReset = () => {
    setIsCreateOpen(false);
    setEditingProduct(null);

    reset({
      name: "",
      description: "",
      imageUrl: "",
      assignments: [{ sectorId: "", productionGroupId: "" }],
    });

    setSelectedFile(null);
    setPreviewUrl("");
    setOriginalImageUrl(null);
    setRemoveImageFlag(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    closeDialogAndReset();
    setIsCreateOpen(true);
  };

  const openEditDialog = async (product: Product) => {
    setEditingProduct(product);
    setIsCreateOpen(false);

    setOriginalImageUrl(product.imageUrl || null);
    setRemoveImageFlag(false);

    reset({
      name: product.name,
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      assignments: [{ sectorId: "", productionGroupId: "" }],
    });

    setPreviewUrl(product.imageUrl || "");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Assignments load
    try {
      // Using helper which now uses axios
      const data = await fetchProductAssignments(product._id);
      const existing: Assignment[] = (data.assignments || []).map((a: any) => ({
        sectorId: a.sectorId?._id || a.sectorId,
        productionGroupId: a.productionGroupId?._id || a.productionGroupId,
      }));

      setValue(
        "assignments",
        existing.length ? existing : [{ sectorId: "", productionGroupId: "" }],
        { shouldDirty: false }
      );
    } catch {
      setValue("assignments", [{ sectorId: "", productionGroupId: "" }], {
        shouldDirty: false,
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setRemoveImageFlag(false);
    const objUrl = URL.createObjectURL(file);
    setPreviewUrl(objUrl);
  };

  const removeImageUI = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setValue("imageUrl", "", { shouldDirty: true });
    setRemoveImageFlag(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // UPLOAD logic
  async function uploadToS3(file: File, productId: string): Promise<string> {
    if (!productId) throw new Error("productId is required for upload");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("productId", productId);

    const { data } = await axios.post("/api/products/upload", fd);
    return data.url;
  }

  // DELETE logic
  async function deleteFromS3ByUrl(url: string) {
    await axios.delete("/api/products/upload", {
      params: { url },
    });
  }

  // SUBMIT
  const onSubmit = async (values: ProductFormValues) => {
    // 1. Validation
    if (!values.name?.trim()) {
      toast.error("Ürün adı zorunludur");
      return;
    }
    const validAssignments = (values.assignments || []).filter(
      (a) => a.sectorId && a.productionGroupId
    );
    if (validAssignments.length === 0) {
      toast.error("En az bir sektör ve üretim grubu seçilmelidir");
      return;
    }

    let finalImageUrl = values.imageUrl || "";

    // NEW PRODUCT
    if (!editingProduct) {
      try {
        // 1. Create Product (without image initially)
        const { data } = await axios.post("/api/products", {
          name: values.name.trim(),
          description: values.description?.trim() || "",
          imageUrl: "",
          assignments: validAssignments,
        });

        const newProduct = data.product;

        // 2. If file selected, upload and then update product
        if (selectedFile) {
          setUploading(true);
          try {
            const url = await uploadToS3(selectedFile, newProduct._id);

            // Update product with the new Image URL
            await axios.put("/api/products", {
              productId: newProduct._id,
              imageUrl: url,
            });
            toast.success("Ürün ve görsel başarıyla oluşturuldu");
          } catch (e: any) {
            console.error(e);
            toast.error(
              "Ürün oluştu fakat görsel yüklenemedi: " +
                (e.response?.data?.error || e.message)
            );
          }
          setUploading(false);
        } else {
          toast.success("Ürün başarıyla oluşturuldu");
        }

        queryClient.invalidateQueries({ queryKey: ["products"] });
        closeDialogAndReset();
      } catch (err: any) {
        const msg = err.response?.data?.error || "Ürün oluşturulamadı";
        toast.error(msg);
      }
      return;
    }

    // EDITING PRODUCT
    if (editingProduct) {
      // 1. Upload if new file
      if (selectedFile) {
        setUploading(true);
        try {
          finalImageUrl = await uploadToS3(selectedFile, editingProduct._id);
        } catch (e: any) {
          setUploading(false);
          toast.error(
            e.response?.data?.error || e.message || "Görsel yüklenemedi"
          );
          return;
        }
        setUploading(false);
      }

      // 2. Delete old if necessary
      const shouldDeleteOld =
        !!originalImageUrl &&
        (removeImageFlag ||
          (finalImageUrl && finalImageUrl !== originalImageUrl));

      // 3. Update
      updateMutation.mutate(
        {
          productId: editingProduct._id,
          name: values.name.trim(),
          description: values.description?.trim() || "",
          imageUrl: removeImageFlag ? "" : finalImageUrl,
          assignments: validAssignments,
        },
        {
          onSuccess: async () => {
            if (shouldDeleteOld && originalImageUrl) {
              try {
                await deleteFromS3ByUrl(originalImageUrl);
              } catch (e) {}
            }
          },
        }
      );
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   RENDER                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Ürün Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">
            Kataloğunuzdaki ürünleri filtreleyin, düzenleyin ve yönetin.
          </p>
        </div>
        <Button onClick={openCreateDialog} size="lg" className="shadow-sm">
          <Plus className="w-5 h-5 mr-2" />
          Yeni Ürün Ekle
        </Button>
      </div>

      {/* FILTERS CARD */}
      <Card className="shadow-sm border-none bg-white">
        <CardContent className="p-4 md:p-6 grid gap-4 md:grid-cols-4 items-center">
          {/* Search */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Ürün adı ara..."
              className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sector Filter */}
          <div className="md:col-span-1">
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <div className="flex items-center gap-2 truncate">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="Sektör Seç" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Sektörler</SelectItem>
                {sectors.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Group Filter (Cascading) */}
          <div className="md:col-span-1">
            <Select
              value={selectedGroup}
              onValueChange={setSelectedGroup}
              disabled={selectedSector === "all"}
            >
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <div className="flex items-center gap-2 truncate">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="Üretim Grubu Seç" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Gruplar</SelectItem>
                {filterGroups.map((g) => (
                  <SelectItem key={g.groupId} value={g.groupId}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end md:justify-start">
            {(searchTerm ||
              selectedSector !== "all" ||
              selectedGroup !== "all") && (
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSector("all");
                  setSelectedGroup("all");
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Filtreleri Temizle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PRODUCTS LIST */}
      <Card className="shadow-md border border-gray-100 overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Ürün Listesi</CardTitle>
              <CardDescription className="mt-1">
                Bulunan toplam ürün:{" "}
                <span className="font-medium text-foreground">
                  {products.length}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {productsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Ürünler yükleniyor...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50">
              <Search className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">
                Ürün bulunamadı
              </h3>
              <p className="text-muted-foreground max-w-sm text-center mt-2">
                Arama kriterlerinize uygun ürün yok veya henüz hiç ürün
                eklemediniz.
              </p>
              <Button
                variant="link"
                className="mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSector("all");
                  setSelectedGroup("all");
                }}
              >
                Filtreleri Temizle
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-[80px]">Görsel</TableHead>
                    <TableHead>Id</TableHead>
                    <TableHead>Ürün Adı</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Açıklama
                    </TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {products.map((p) => (
                      <motion.tr
                        key={p._id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="group hover:bg-gray-50/80 transition-colors border-b last:border-0"
                      >
                        <TableCell className="py-3">
                          {p.imageUrl ? (
                            <div className="relative w-12 h-12 rounded-md overflow-hidden border border-gray-200 shadow-sm">
                              <Image
                                src={p.imageUrl}
                                alt={p.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-400 font-medium">
                              YOK
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-800">
                          {p._id}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-800">
                          {p.name}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground max-w-md truncate">
                          {p.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openEditDialog(p)}
                            >
                              <span className="sr-only">Düzenle</span>
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setDeletingProduct(p)}
                            >
                              <span className="sr-only">Sil</span>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {/* {total > PAGE_SIZE && (
          <CardFooter className="flex items-center justify-end space-x-2 py-4 border-t bg-gray-50/50">
            <div className="flex-1 text-sm text-muted-foreground">
              Toplam {Math.ceil(total / PAGE_SIZE)} sayfa ({total} ürün)
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || productsLoading}
              >
                Önceki
              </Button>
              <div className="inline-flex items-center justify-center text-sm font-medium w-8">
                {page}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={
                  page >= Math.ceil(total / PAGE_SIZE) || productsLoading
                }
              >
                Sonraki
              </Button>
            </div>
          </CardFooter>
        )} */}
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t py-4">
            <div className="text-sm text-muted-foreground">
              Toplam {total} ürün · {totalPages} sayfa
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                    aria-disabled={page === 1}
                    className={
                      page === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>

                {/* Page numbers */}
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNumber = i + 1;

                  // Çok sayfa varsa ortayı gösterelim
                  if (
                    totalPages > 7 &&
                    pageNumber !== 1 &&
                    pageNumber !== totalPages &&
                    Math.abs(pageNumber - page) > 1
                  ) {
                    if (pageNumber === page - 2 || pageNumber === page + 2) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  }

                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        isActive={page === pageNumber}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(pageNumber);
                        }}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                    aria-disabled={page === totalPages}
                    className={
                      page === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        )}
      </Card>
      {/* CREATE / EDIT DIALOG */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialogAndReset();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
            </DialogTitle>
            <DialogDescription>
              Ürün detaylarını girin. Görsel yüklemek için önce ürünü oluşturun
              (otomatik yapılır).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid gap-6">
              {/* Image Upload Area */}
              <div className="flex justify-center">
                <div className="space-y-3 w-full max-w-xs text-center">
                  <Label>Ürün Görseli</Label>
                  {previewUrl ? (
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden border shadow-sm group">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeImageUI}
                          disabled={uploading}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Görseli Kaldır
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="aspect-square w-full rounded-xl border-2 border-dashed border-gray-200 hover:border-primary/50 transition-colors flex flex-col items-center justify-center bg-gray-50/50 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-600">
                        Görsel Yükle
                      </p>
                      <p className="text-xs text-gray-400">
                        PNG, JPG (Max 5MB)
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {uploading && (
                    <p className="text-xs text-blue-600 flex items-center justify-center font-medium animate-pulse">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Yükleniyor...
                    </p>
                  )}
                  {/* Hidden input for RHF */}
                  <input type="hidden" {...register("imageUrl")} />
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Ürün Adı *</Label>
                  <Input
                    id="name"
                    placeholder="Örn: PVC Boru"
                    {...register("name")}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    placeholder="Ürün hakkında kısa bilgi..."
                    {...register("description")}
                  />
                </div>
              </div>

              <Separator />

              {/* Assignments */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">
                    Kategori Atamaları
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({ sectorId: "", productionGroupId: "" })
                    }
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Kategori Ekle
                  </Button>
                </div>

                <div className="space-y-3">
                  {fields.map((f, index) => (
                    <AssignmentRowRHF
                      key={f.id}
                      index={index}
                      sectors={sectors}
                      removeRow={() => remove(index)}
                      canRemove={fields.length > 1}
                      form={form}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialogAndReset}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingProduct ? "Değişiklikleri Kaydet" : "Ürünü Oluştur"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT */}
      <AlertDialog
        open={!!deletingProduct}
        onOpenChange={() => setDeletingProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deletingProduct?.name}</strong> ürünü silinecek. Buna
              bağlı tüm kategori atamaları da kaldırılacak. Bu işlem geri
              alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingProduct && deleteMutation.mutate(deletingProduct)
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Sil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                           SUB-COMPONENTS                                   */
/* -------------------------------------------------------------------------- */

function AssignmentRowRHF({
  index,
  sectors,
  canRemove,
  removeRow,
  form,
}: {
  index: number;
  sectors: Sector[];
  canRemove: boolean;
  removeRow: () => void;
  form: ReturnType<typeof useForm<ProductFormValues>>;
}) {
  const sectorId = form.watch(`assignments.${index}.sectorId`);

  const { data: groupsData } = useQuery({
    queryKey: ["groups", sectorId],
    queryFn: () => fetchGroups(sectorId),
    enabled: !!sectorId,
  });

  const groups = useMemo(() => groupsData?.groups || [], [groupsData]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg border bg-gray-50/50 items-start sm:items-end">
      <div className="w-full sm:flex-1">
        <Label className="text-xs text-muted-foreground mb-1.5 block">
          Sektör
        </Label>
        <Select
          value={sectorId || ""}
          onValueChange={(val) => {
            form.setValue(`assignments.${index}.sectorId`, val, {
              shouldDirty: true,
            });
            form.setValue(`assignments.${index}.productionGroupId`, "", {
              shouldDirty: true,
            });
          }}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Sektör Seç" />
          </SelectTrigger>
          <SelectContent>
            {sectors.map((s) => (
              <SelectItem key={s._id} value={s._id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:flex-1">
        <Label className="text-xs text-muted-foreground mb-1.5 block">
          Üretim Grubu
        </Label>
        <Select
          value={form.watch(`assignments.${index}.productionGroupId`) || ""}
          onValueChange={(val) =>
            form.setValue(`assignments.${index}.productionGroupId`, val, {
              shouldDirty: true,
            })
          }
          disabled={!sectorId}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Grup Seç" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectItem key={g.groupId} value={g.groupId}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive shrink-0"
          onClick={removeRow}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
