"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Package,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { FormSectionStickyWrapper } from "@/components/form3/form-section/FormSectionStickyWrapper";

export const PreviewFormSection = ({
  form,
  sectors,
  groups,
  products,
}: {
  form: any;
  sectors: Array<{ sectorId: string; name: string }>;
  groups: Array<{ groupId: string; name: string }>;
  products: Array<{ productId: string; name: string }>;
}) => {
  const values = form.getValues();
  const {
    sektor, // sectorId or null
    urunler, // [{ productId, productionGroupId }]
    firmaAdi,
    ad,
    soyad,
    email,
    telefon,
    adres,
  } = values;

  /* -------------------------------------------------------------------------- */
  /*                              SEKTÖR BİLGİSİ                                 */
  /* -------------------------------------------------------------------------- */

  const selectedSector = sectors.find((s) => s.sectorId === sektor);

  /* -------------------------------------------------------------------------- */
  /*                       ÜRETİM GRUPLARINI TEKRARSIZ TOPLA                    */
  /* -------------------------------------------------------------------------- */

  const selectedGroupIds = Array.from(
    new Set(urunler?.map((item: any) => item.productionGroupId))
  );

  const selectedGroups = selectedGroupIds
    .map((gid) => groups.find((g) => g.groupId === gid))
    .filter(Boolean);

  /* -------------------------------------------------------------------------- */
  /*                           ÜRÜNLERİ İSİM OLARAK ÇÖZ                          */
  /* -------------------------------------------------------------------------- */

  const selectedProducts = urunler
    ?.map((item: any) => {
      const product = products.find((p) => p.productId === item.productId);
      const group = groups.find((g) => g.groupId === item.productionGroupId);

      return product
        ? {
            name: product.name,
            groupName: group?.name ?? "—",
          }
        : null;
    })
    .filter(Boolean);

  return (
    <FormSectionStickyWrapper
      title="Önizleme ve Onay"
      description="Lütfen bilgilerinizi kontrol edip onaylayınız."
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* --- Talep Detayları --- */}
          <Card className="md:col-span-2 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-primary" />
                Talep Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {/* SEKTÖR */}
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Sektör
                </p>
                <p className="font-medium text-lg text-foreground">
                  {selectedSector?.name || "—"}
                </p>
              </div>

              {/* ÜRETİM GRUPLARI */}
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="w-4 h-4" /> Üretim Grupları
                </p>
                <p className="font-medium text-lg text-foreground">
                  {selectedGroups.length > 0
                    ? selectedGroups.map((g) => g!.name).join(", ")
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* --- Seçilen Ürünler --- */}
          <Card className="md:col-span-2 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Seçilen Ürünler ({selectedProducts?.length || 0})
              </CardTitle>
            </CardHeader>

            <CardContent>
              {selectedProducts?.length > 0 ? (
                <div className="rounded-md border bg-background">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="h-12 px-4 text-left font-medium text-muted-foreground">
                          Ürün Adı
                        </th>
                        <th className="h-12 px-4 text-left font-medium text-muted-foreground">
                          Üretim Grubu
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedProducts.map((item: any, index: number) => (
                        <tr
                          key={index}
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          <td className="p-4 font-medium">{item.name}</td>
                          <td className="p-4">{item.groupName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground italic p-4 text-center bg-muted/30 rounded-lg">
                  Ürün seçilmedi.
                </p>
              )}
            </CardContent>
          </Card>

          {/* --- İletişim Bilgileri --- */}
          <Card className="md:col-span-2 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" />
                İletişim Bilgileri
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-6 sm:grid-cols-2">
              {/* Firma Adı */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Firma Adı
                </p>
                <p className="font-medium text-base">{firmaAdi}</p>
                <Separator className="mt-2" />
              </div>

              {/* Yetkili Kişi */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" /> Yetkili Kişi
                </p>
                <p className="font-medium text-base">
                  {ad} {soyad}
                </p>
                <Separator className="mt-2" />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" /> E-posta
                </p>
                <p className="font-medium text-base">{email || "—"}</p>
                <Separator className="mt-2" />
              </div>

              {/* Telefon */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Telefon
                </p>
                <p className="font-medium text-base">{telefon}</p>
                <Separator className="mt-2" />
              </div>

              {/* Adres */}
              <div className="space-y-1 sm:col-span-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Adres
                </p>
                <p className="font-medium text-base">{adres || "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FormSectionStickyWrapper>
  );
};
