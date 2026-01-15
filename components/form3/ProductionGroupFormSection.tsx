"use client";

import { Controller } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

import { Field, FieldError } from "@/components/ui/field";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2 } from "lucide-react";

import { getProductionGroupImage } from "@/constants/productionGroups";

interface Props {
  form: any;
  groups: Array<{
    groupId: string;
    name: string;
    products: Array<any>;
  }>;
}

export const ProductionGroupFormSection = ({ form, groups }: Props) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  const selectedGroupId = form.watch("uretimGrubu");

  // Smooth scroll when group selected
  useEffect(() => {
    if (!selectedGroupId) return;

    const el = sectionRef.current;
    if (!el) return; // ⬅ Null safety

    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const sectionBottom = rect.bottom;
      const windowHeight = window.innerHeight;

      let scrollAmount = 0;

      if (sectionBottom > windowHeight) {
        scrollAmount = sectionBottom - windowHeight + 200;
      } else {
        scrollAmount = 400;
      }

      const startPosition = window.pageYOffset;
      const target = startPosition + scrollAmount;

      window.scrollTo({
        top: target,
        behavior: "smooth",
      });
    }, 400);
  }, [selectedGroupId]);

  // Search filtered groups
  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={sectionRef} className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Üretim Grubu Seçimi
        </h2>
        <p className="text-sm text-muted-foreground">
          Lütfen ilgilendiğiniz üretim grubunu seçiniz.
        </p>
      </div>

      <Controller
        name="uretimGrubu"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="space-y-3">
            {/* Search bar */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Üretim grubu ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-12 text-base shadow-sm"
                />
              </div>
            </div>

            {/* Group cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => {
                  const isSelected = field.value === group.groupId;

                  return (
                    <Card
                      key={group.groupId}
                      className={cn(
                        "group cursor-pointer transition-all duration-300",
                        "hover:shadow-md hover:border-primary/50",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                          : "hover:border-gray-300"
                      )}
                      onClick={() => field.onChange(group.groupId)}
                    >
                      <CardHeader className="p-0">
                        {/* Image container */}
                        <div className="relative w-full aspect-[4/3] rounded-t-lg overflow-hidden">
                          <Image
                            src={getProductionGroupImage(group.name)}
                            alt={group.name}
                            fill
                            className="object-cover transition-all duration-500 group-hover:scale-105"
                          />

                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                              <CheckCircle2 className="w-8 h-8 text-primary" />
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-semibold">
                            {group.name}
                          </CardTitle>

                          {isSelected && (
                            <Badge className="bg-primary">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Seçildi
                            </Badge>
                          )}
                        </div>

                        <input
                          type="radio"
                          value={group.groupId}
                          checked={isSelected}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="sr-only"
                        />
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full text-center p-8 border rounded-lg border-dashed bg-muted/30">
                  <Search className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                  <p className="text-muted-foreground font-medium">
                    Aranan üretim grubuna uygun sonuç bulunamadı.
                  </p>
                </div>
              )}
            </div>

            {/* Error */}
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} className="mt-2" />
            )}
          </Field>
        )}
      />
    </div>
  );
};
