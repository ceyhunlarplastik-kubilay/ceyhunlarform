"use client";

import { useState } from "react";
import { useDebounce } from "use-debounce";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import StickyColumnsTable, {
  Customer,
} from "@/components/customized/table/table-07";
import { CustomersPagination } from "@/components/customers/CustomersPagination";
import { CustomersTableSkeleton } from "@/components/customers/CustomersTableSkeleton";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

/* -------------------------------------------------------------------------- */

interface PaginatedResponse {
  customers: Customer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/* -------------------------------------------------------------------------- */

async function fetchCustomers(
  page: number,
  search: string,
  sector: string,
  group: string,
  product: string
): Promise<PaginatedResponse> {
  const params = new URLSearchParams();

  if (search) params.set("search", search);
  else params.set("page", String(page));

  if (sector) params.set("sector", sector);
  if (group) params.set("productionGroup", group);
  if (product) params.set("product", product);

  const res = await fetch(`/api/customers?${params.toString()}`);
  if (!res.ok) throw new Error("Müşteriler alınamadı");
  return res.json();
}

/* -------------------------------------------------------------------------- */

export default function CustomersPageClient() {
  const searchParams = useSearchParams();
  const initialPage = Number(searchParams?.get("page")) || 1;

  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );

  const queryClient = useQueryClient();

  const customersQuery = useQuery({
    queryKey: ["customers", page, debouncedSearch],
    queryFn: () => fetchCustomers(page, debouncedSearch, "", "", ""),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinemedi");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Kayıt silindi");
      setCustomerToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: () => toast.error("Silme başarısız"),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch("/api/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Durum güncellenemedi");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Durum güncellendi");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  return (
    <>
      {/* HEADER */}
      <header className="flex items-center justify-between py-4 border-b mb-6">
        <h1 className="text-xl font-bold">Müşteriler</h1>
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton>
            <Button>Giriş Yap</Button>
          </SignInButton>
        </SignedOut>
      </header>

      {/* SEARCH */}
      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Müşteri ara..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Button variant="outline" onClick={() => customersQuery.refetch()}>
          Yenile
        </Button>
      </div>

      {/* TABLE */}
      <section className="border rounded-lg overflow-hidden bg-card">
        {customersQuery.isLoading ? (
          <CustomersTableSkeleton />
        ) : (
          <StickyColumnsTable
            customers={customersQuery.data?.customers || []}
            onDelete={(c) => setCustomerToDelete(c)}
            onStatusUpdate={(id, status) =>
              statusMutation.mutate({ id, status })
            }
          />
        )}

        {customersQuery.data?.pagination && !debouncedSearch && (
          <CustomersPagination
            page={page}
            setPage={setPage}
            data={customersQuery.data}
          />
        )}
      </section>

      {/* DELETE DIALOG */}
      <AlertDialog
        open={!!customerToDelete}
        onOpenChange={() => setCustomerToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              <b>{customerToDelete?.companyName}</b> silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(customerToDelete!.mongoId)}
              >
                Sil
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
