"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface Sector {
  _id: string;
  name: string;
  imageUrl?: string;
}

interface ProductionGroup {
  _id: string;
  name: string;
}

export default function AdminSectorsPage() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Sector | null>(null);
  const [deleting, setDeleting] = useState<Sector | null>(null);
  const [name, setName] = useState("");

  // IMAGE UPLOAD STATE
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [removeImageFlag, setRemoveImageFlag] = useState(false);

  const [dependentGroups, setDependentGroups] = useState<ProductionGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Clean up preview blob URLs
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  /* -------------------------------------------------------------------------- */
  /*                                    DATA                                    */
  /* -------------------------------------------------------------------------- */

  const { data: sectors = [], isLoading } = useQuery({
    queryKey: ["sectors"],
    queryFn: async () => (await axios.get("/api/sectors")).data,
  });

  /* -------------------------------------------------------------------------- */
  /*                                  MUTATIONS                                 */
  /* -------------------------------------------------------------------------- */

  async function uploadToS3(file: File, sectorId: string): Promise<string> {
    if (!sectorId) throw new Error("sectorId is required for upload");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("sectorId", sectorId);

    const { data } = await axios.post("/api/sectors/upload", fd);
    return data.url;
  }

  async function deleteFromS3ByUrl(url: string) {
    await axios.delete("/api/sectors/upload", {
      params: { url },
    });
  }

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; imageUrl?: string }) => {
      const { data } = await axios.post("/api/sectors", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Sektör oluşturuldu");
      qc.invalidateQueries({ queryKey: ["sectors"] });
      closeDialog();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Hata"),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      name: string;
      imageUrl?: string;
    }) => {
      const { data } = await axios.put("/api/sectors", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Sektör güncellendi");
      qc.invalidateQueries({ queryKey: ["sectors"] });
      closeDialog();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Hata"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (sector: Sector) => {
      // 1) S3 görsel sil (varsa)
      if (sector.imageUrl) {
        await deleteFromS3ByUrl(sector.imageUrl).catch(() => {});
      }
      // 2) Sektör sil
      await axios.delete("/api/sectors", { params: { id: sector._id } });
    },
    onSuccess: () => {
      toast.success("Sektör silindi");
      qc.invalidateQueries({ queryKey: ["sectors"] });
      setDeleting(null);
      setDependentGroups([]);
    },
    onError: (e: any) => {
      if (e.response?.data?.details?.action) {
        toast.error(e.response.data.error, {
          description: e.response.data.details.action,
          duration: 5000,
        });
      } else {
        toast.error(e.response?.data?.error || "Silinemedi");
      }
    },
  });

  /* -------------------------------------------------------------------------- */
  /*                                  HELPERS                                   */
  /* -------------------------------------------------------------------------- */

  const resetInternalState = () => {
    setName("");
    setSelectedFile(null);
    setPreviewUrl("");
    setOriginalImageUrl(null);
    setRemoveImageFlag(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreate = () => {
    setEditing(null);
    resetInternalState();
    setIsOpen(true);
  };

  const openEdit = (s: Sector) => {
    setEditing(s);
    setName(s.name);
    setIsOpen(true);

    // Image Setup
    setOriginalImageUrl(s.imageUrl || null);
    setPreviewUrl(s.imageUrl || "");
    setSelectedFile(null);
    setRemoveImageFlag(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeDialog = () => {
    setIsOpen(false);
    setEditing(null);
    resetInternalState();
  };

  const openDelete = async (s: Sector) => {
    setDeleting(s);
    setDependentGroups([]);
    setLoadingGroups(true);

    try {
      const { data } = await axios.get("/api/production-groups", {
        params: { sectorId: s._id },
      });
      setDependentGroups(data || []);
    } catch {
      setDependentGroups([]);
    } finally {
      setLoadingGroups(false);
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
    setRemoveImageFlag(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    let finalImageUrl = editing?.imageUrl || "";

    // IF CREATING
    if (!editing) {
      try {
        // 1. Create Sector first
        const { data: newSector } = await axios.post("/api/sectors", { name });

        // 2. If file, upload
        if (selectedFile) {
          setUploading(true);
          try {
            const url = await uploadToS3(selectedFile, newSector._id);
            // Update sector with image
            await axios.put("/api/sectors", {
              id: newSector._id,
              name: newSector.name,
              imageUrl: url,
            });
          } catch (e) {
            toast.error("Sektör oluşturuldu ancak görsel yüklenemedi");
          }
          setUploading(false);
        }

        toast.success("Sektör oluşturuldu");
        qc.invalidateQueries({ queryKey: ["sectors"] });
        closeDialog();
      } catch (e: any) {
        toast.error(e.response?.data?.error || "Oluşturulamadı");
      }
      return;
    }

    // IF EDITING
    if (editing) {
      // 1. Upload if new file
      if (selectedFile) {
        setUploading(true);
        try {
          finalImageUrl = await uploadToS3(selectedFile, editing._id);
        } catch (e: any) {
          setUploading(false);
          toast.error("Görsel yüklenemedi");
          return;
        }
        setUploading(false);
      }

      // 2. Delete old if necessary
      const shouldDeleteOld =
        !!originalImageUrl &&
        (removeImageFlag ||
          (finalImageUrl && finalImageUrl !== originalImageUrl));

      const payload = {
        id: editing._id,
        name,
        imageUrl: removeImageFlag ? "" : finalImageUrl,
      };

      updateMutation.mutate(payload, {
        onSuccess: async () => {
          if (shouldDeleteOld && originalImageUrl) {
            await deleteFromS3ByUrl(originalImageUrl).catch(() => {});
          }
        },
      });
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   RENDER                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sektörler</h1>
          <p className="text-muted-foreground mt-1">
            Sektörleri ve kapak görsellerini yönetin.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Sektör Ekle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mevcut Sektörler</CardTitle>
          <CardDescription>
            Listelenen toplam sektör: {sectors.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Görsel</TableHead>
                  <TableHead>Sektör Adı</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectors.map((s: Sector) => (
                  <TableRow key={s._id}>
                    <TableCell className="py-2">
                      {s.imageUrl ? (
                        <div className="relative w-12 h-12 rounded-md overflow-hidden border">
                          <Image
                            src={s.imageUrl}
                            alt={s.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                          YOK
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openDelete(s)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={isOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Sektör Düzenle" : "Yeni Sektör"}
            </DialogTitle>
            <DialogDescription>Sektör bilgilerini giriniz.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Sektör Adı</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Avize..."
              />
            </div>

            <div className="space-y-2">
              <Label>Kapak Görseli</Label>
              <div className="flex items-start gap-4">
                {previewUrl ? (
                  <div className="relative w-24 h-24 rounded-md overflow-hidden border shrink-0 group">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={removeImageUI}
                      className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-md border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground bg-gray-50 shrink-0">
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-xs">Görsel Seç</span>
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileSelect}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Sektör için temsili bir görsel yükleyin.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              İptal
            </Button>
            <Button disabled={!name.trim() || uploading} onClick={handleSubmit}>
              {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sektörü Sil</AlertDialogTitle>

            <AlertDialogDescription>
              <strong>{deleting?.name}</strong> sektörü silinecek.
            </AlertDialogDescription>

            <div className="space-y-3 mt-3">
              {loadingGroups && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Üretim grupları kontrol ediliyor...
                </div>
              )}

              {!loadingGroups && dependentGroups.length > 0 && (
                <div className="rounded-md border bg-muted/50 p-3 space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    Bu sektöre bağlı üretim grupları var:
                  </p>

                  <ul className="list-disc pl-5 text-sm">
                    {dependentGroups.map((g) => (
                      <li key={g._id}>{g.name}</li>
                    ))}
                  </ul>

                  <p className="text-xs text-muted-foreground">
                    Bu grupları silmeden sektörü silemezsiniz.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              disabled={dependentGroups.length > 0}
              className={
                dependentGroups.length > 0
                  ? "opacity-50 cursor-not-allowed"
                  : "bg-destructive hover:bg-destructive/90"
              }
              onClick={() => {
                if (deleting) {
                  deleteMutation.mutate(deleting);
                }
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
