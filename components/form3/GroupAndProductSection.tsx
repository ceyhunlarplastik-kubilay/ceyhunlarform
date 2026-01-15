"use client";

import { Controller } from "react-hook-form";
import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Field, FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface GroupData {
  groupId: string;
  name: string;
  products: Array<{ productId: string; name: string }>;
}

interface ProductSelection {
  productId: string;
  productionGroupId: string;
}

export const GroupAndProductSection = ({
  form,
  groups,
}: {
  form: any;
  groups: GroupData[];
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Store refs to section elements for direct access
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const [activeGroupId, setActiveGroupId] = useState<string>("");
  const [search, setSearch] = useState("");

  // Watch form values
  const selectedProducts: ProductSelection[] = form.watch("urunler") || [];

  // Memoized Set for O(1) lookup performance
  const selectedProductIds = useMemo(
    () => new Set(selectedProducts.map((p) => p.productId)),
    [selectedProducts]
  );

  // Filtered groups based on search
  const filteredGroups = useMemo(
    () =>
      groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())),
    [groups, search]
  );

  // Scroll to group handler with Offset
  const scrollToGroup = useCallback((groupId: string) => {
    const element = document.getElementById(groupId);
    if (element) {
      const offset = 120; // Sticky header offset
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // Immediately set active to give instant feedback
      setActiveGroupId(groupId);
    }
  }, []);

  // Robust Scroll Spy Logic
  useEffect(() => {
    const handleScroll = () => {
      // The "Focus Point" is where the user is looking.
      // 150px is approximately just below the sticky headers.
      // If a section contains this point, it is the active section.
      const focusPoint = 150;

      let currentActiveId = "";
      let minDistanceToFocus = Infinity;
      let foundContainer = false;

      // First pass: Check if focus point is INSIDE any section
      for (const group of groups) {
        const element = document.getElementById(group.groupId);
        if (!element) continue;

        // Update ref just in case
        sectionRefs.current[group.groupId] = element;

        const rect = element.getBoundingClientRect();

        // Check if focus point is within this section's vertical bounds
        // Using a slightly wider range for better detection
        if (rect.top <= focusPoint && rect.bottom > focusPoint) {
          currentActiveId = group.groupId;
          foundContainer = true;
          break; // Found it, no need to check others
        }
      }

      // Second pass: If not inside any (e.g. at the very top or bottom gaps), find nearest top
      if (!foundContainer) {
        // Special case: At the very top of page
        if (window.scrollY < 50 && groups.length > 0) {
          currentActiveId = groups[0].groupId;
        } else {
          for (const group of groups) {
            const element = document.getElementById(group.groupId);
            if (!element) continue;
            const rect = element.getBoundingClientRect();

            // Find section whose top is closest to focus point
            const distance = Math.abs(rect.top - focusPoint);

            if (distance < minDistanceToFocus) {
              minDistanceToFocus = distance;
              currentActiveId = group.groupId;
            }
          }
        }
      }

      if (currentActiveId && currentActiveId !== activeGroupId) {
        setActiveGroupId(currentActiveId);
      }
    };

    // Attach listener
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Initial check (in case of page reload with scroll position)
    // Small delay to ensure DOM is ready
    const timer = setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [groups, activeGroupId]); // Re-run if groups change

  // Handle product selection toggle
  const handleProductToggle = useCallback(
    (
      field: any,
      productId: string,
      productionGroupId: string,
      isChecked: boolean
    ) => {
      const current: ProductSelection[] = field.value || [];

      if (isChecked) {
        const exists = current.some((p) => p.productId === productId);
        if (!exists) {
          field.onChange([...current, { productId, productionGroupId }]);
        }
      } else {
        field.onChange(current.filter((p) => p.productId !== productId));
      }
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Üretim Grubu + Ürün Seçimi
        </h2>
        <p className="text-sm text-muted-foreground">
          Lütfen üretim grubunu seçiniz ve ilgili ürünlerden bir veya birkaçını
          işaretleyiniz.
        </p>
      </div>

      {/* SEARCH BAR */}
      <div className="flex justify-center mb-4">
        <input
          placeholder="Üretim grubu ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-lg h-12 px-4 rounded-lg border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* TOP HORIZONTAL GROUP SELECTOR */}
      <div className="flex gap-2 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-gray-300 sticky top-0 bg-background/95 backdrop-blur z-10">
        {filteredGroups.map((g) => {
          const isActive = activeGroupId === g.groupId;
          const hasSelectedProducts = selectedProducts.some(
            (p) => p.productionGroupId === g.groupId
          );

          return (
            <button
              key={g.groupId}
              type="button"
              onClick={() => scrollToGroup(g.groupId)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-full border text-sm transition-all flex items-center gap-2",
                isActive
                  ? "bg-primary text-white border-primary shadow"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100",
                hasSelectedProducts &&
                  !isActive &&
                  "border-primary/50 bg-primary/5"
              )}
            >
              {g.name}
              {hasSelectedProducts && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-5 h-5 text-xs rounded-full",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-primary/20 text-primary"
                  )}
                >
                  {
                    selectedProducts.filter(
                      (p) => p.productionGroupId === g.groupId
                    ).length
                  }
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* GROUP + PRODUCTS */}
      <Controller
        name="urunler"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="space-y-4">
            <div ref={containerRef} className="space-y-4">
              {groups.map((group) => (
                <div
                  key={group.groupId}
                  id={group.groupId}
                  className={cn(
                    "space-y-2 border rounded-lg p-4 transition-colors user-select-none",
                    activeGroupId === group.groupId
                      ? "bg-primary/5 border-primary/30"
                      : "bg-gray-50"
                  )}
                >
                  {/* GROUP TITLE */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-primary">
                      {group.name}
                    </h3>

                    <span className="text-xs text-muted-foreground">
                      {group.products.length} ürün
                    </span>
                  </div>

                  {/* PRODUCT LIST */}
                  <div className="space-y-2 pt-2">
                    {group.products.map((product) => {
                      const isChecked = selectedProductIds.has(
                        product.productId
                      );

                      return (
                        <label
                          key={product.productId}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                            "hover:bg-gray-100",
                            isChecked && "border-primary bg-primary/5"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              handleProductToggle(
                                field,
                                product.productId,
                                group.groupId,
                                e.target.checked
                              );
                            }}
                            className="mt-1 h-4 w-4 text-primary border-gray-300 rounded accent-primary"
                          />

                          <span className="font-medium">{product.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* ERROR */}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}

            {/* SELECTED COUNT */}
            {selectedProducts.length > 0 && (
              <div className="mt-3 p-3 bg-primary/5 rounded-lg">
                <p className="text-sm font-medium">
                  Seçilen ürün sayısı: {selectedProducts.length}
                </p>
              </div>
            )}
          </Field>
        )}
      />
    </div>
  );
};
