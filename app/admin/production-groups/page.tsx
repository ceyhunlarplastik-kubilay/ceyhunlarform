"use client";

import { useState, useMemo } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AppBreadcrumb } from "@/components/breadcrumbs/AppBreadcrumb";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface Sector {
  _id: string;
  name: string;
}

interface ProductionGroup {
  _id: string;
  name: string;
  sectorId: Sector;
}

interface Product {
  _id: string;
  name: string;
}

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

export default function AdminProductionGroupsPage() {
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [editing, setEditing] = useState<ProductionGroup | null>(null);
  const [deleting, setDeleting] = useState<ProductionGroup | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [dependentProducts, setDependentProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Accordion
  const [productsByGroup, setProductsByGroup] = useState<
    Record<string, Product[]>
  >({});
  const [loadingGroupId, setLoadingGroupId] = useState<string | null>(null);

  /* -------------------------- LAZY LOAD PRODUCTS -------------------------- */

  const loadProductsForGroup = async (groupId: string) => {
    if (productsByGroup[groupId]) return; // cache varsa tekrar çağırma

    setLoadingGroupId(groupId);
    try {
      const { data } = await axios.get("/api/products", {
        params: { productionGroupId: groupId },
      });
      setProductsByGroup((prev) => ({
        ...prev,
        [groupId]: data || [],
      }));
    } catch {
      setProductsByGroup((prev) => ({
        ...prev,
        [groupId]: [],
      }));
    } finally {
      setLoadingGroupId(null);
    }
  };

  /* ------------------------------- DATA -------------------------------- */

  const { data: sectors = [] } = useQuery({
    queryKey: ["sectors"],
    queryFn: async () => (await axios.get("/api/sectors")).data,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["production-groups"],
    queryFn: async () => (await axios.get("/api/production-groups")).data,
  });

  /* ---------------------- GROUP BY SECTOR ---------------------- */

  const groupedBySector = useMemo(() => {
    const map = new Map<
      string,
      { sector: Sector; groups: ProductionGroup[] }
    >();

    for (const g of groups) {
      const sid = g.sectorId._id;
      if (!map.has(sid)) {
        map.set(sid, { sector: g.sectorId, groups: [] });
      }
      map.get(sid)!.groups.push(g);
    }

    return Array.from(map.values());
  }, [groups]);

  /* ------------------------------ MUTATIONS ------------------------------ */

  const createMutation = useMutation({
    mutationFn: async () =>
      axios.post("/api/production-groups", { name, sectorId }),
    onSuccess: () => {
      toast.success("Üretim grubu oluşturuldu");
      setName("");
      setSectorId("");
      qc.invalidateQueries({ queryKey: ["production-groups"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Hata"),
  });

  const updateMutation = useMutation({
    mutationFn: async () =>
      axios.put("/api/production-groups", {
        id: editing!._id,
        name,
        sectorId,
      }),
    onSuccess: () => {
      toast.success("Üretim grubu güncellendi");
      closeDialog();
      qc.invalidateQueries({ queryKey: ["production-groups"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Hata"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      axios.delete("/api/production-groups", { params: { id } }),
    onSuccess: () => {
      toast.success("Üretim grubu silindi");
      setDeleting(null);
      setDependentProducts([]);
      qc.invalidateQueries({ queryKey: ["production-groups"] });
    },
    onError: (e: any) => {
      if (e.response?.data?.details?.action) {
        toast.error(e.response.data.error, {
          description: e.response.data.details.action,
        });
      } else {
        toast.error(e.response?.data?.error || "Silinemedi");
      }
    },
  });

  /* ------------------------------ HELPERS ------------------------------ */

  const openEdit = (g: ProductionGroup) => {
    setEditing(g);
    setName(g.name);
    setSectorId(g.sectorId._id);
    setEditDialogOpen(true); // 🔥 dialog açılıyor
  };

  const closeDialog = () => {
    setEditDialogOpen(false);
    setEditing(null);
    setName("");
    setSectorId("");
  };

  const openDelete = async (g: ProductionGroup) => {
    setDeleting(g);
    setDependentProducts([]);
    setLoadingProducts(true);

    try {
      const { data } = await axios.get("/api/products", {
        params: { productionGroupId: g._id },
      });
      setDependentProducts(data || []);
    } catch {
      setDependentProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   RENDER                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Admin", href: "/admin" },
          { label: "Üretim Grupları" },
        ]}
      />
      {/* CREATE / EDIT */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editing ? "Üretim Grubu Güncelle" : "Yeni Üretim Grubu"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Grup adı"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Select value={sectorId} onValueChange={setSectorId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Sektör" />
            </SelectTrigger>
            <SelectContent>
              {sectors.map((s: Sector) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() =>
              editing ? updateMutation.mutate() : createMutation.mutate()
            }
            disabled={!name.trim() || !sectorId}
          >
            <Plus className="w-4 h-4 mr-2" />
            {editing ? "Güncelle" : "Ekle"}
          </Button>

          {editing && (
            <Button variant="ghost" onClick={closeDialog}>
              İptal
            </Button>
          )}
        </CardContent>
      </Card>

      {/* LIST */}

      <Accordion type="single" collapsible className="space-y-4">
        {groupedBySector.map(({ sector, groups }) => (
          <AccordionItem
            key={sector._id}
            value={sector._id}
            className="border rounded-lg bg-card text-card-foreground shadow-sm px-4"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <span className="text-lg font-semibold">{sector.name}</span>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-2">
              {groups.map((g) => (
                <div
                  key={g._id}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{g.name}</span>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(g)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openDelete(g)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* DELETE DIALOG */}
      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Üretim Grubunu Sil</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-3">
            <p>
              <strong>{deleting?.name}</strong> silinecek.
            </p>

            {loadingProducts && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Ürünler kontrol ediliyor...
              </div>
            )}

            {!loadingProducts && dependentProducts.length > 0 && (
              <div className="rounded-md border bg-muted/50 p-3 space-y-2">
                <p className="text-sm font-medium text-destructive">
                  Bu gruba bağlı ürünler var:
                </p>
                <ul className="list-disc pl-5 text-sm">
                  {dependentProducts.map((p) => (
                    <li key={p._id}>{p.name}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Bu ürünleri veya atamaları silmeden devam edemezsiniz.
                </p>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              disabled={dependentProducts.length > 0}
              className={
                dependentProducts.length > 0
                  ? "opacity-50 cursor-not-allowed"
                  : "bg-destructive hover:bg-destructive/90"
              }
              onClick={() => deleting && deleteMutation.mutate(deleting._id)}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Üretim Grubu Güncelle</DialogTitle>
            <DialogDescription>
              Üretim grubunun adını veya sektörünü güncelleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Grup adı"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Select value={sectorId} onValueChange={setSectorId}>
              <SelectTrigger>
                <SelectValue placeholder="Sektör" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((s: Sector) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={closeDialog}>
              İptal
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={!name.trim() || !sectorId}
            >
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
