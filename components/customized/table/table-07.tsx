// components/customized/table/table-07.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Customer tipini MULTI-GROUP & MULTI-PRODUCT formatına göre güncelledik
export interface Customer {
  id: number;
  tarih: string;
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  province?: string; // İl
  district?: string; // İlçe
  address: string;
  sector: string;
  productionGroups: string; // artık string (ör: "Bisiklet..., Kış Sporları")
  products: string; // multi-product string (ör: "Bisiklet Aksesuarları, Tırmanış Duvarları")
  mongoId: string; // DELETE için
  status: string; // Yeni eklenen alan
}

interface StickyColumnsTableProps {
  customers: Customer[];
  onDelete?: (customer: Customer) => void;
  onStatusUpdate?: (id: string, newStatus: string) => void;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "Bekliyor", color: "bg-gray-100 text-gray-800" },
  review: { label: "İnceleniyor", color: "bg-blue-100 text-blue-800" },
  approved: { label: "Onaylandı", color: "bg-green-100 text-green-800" },
  preparing: { label: "Hazırlanıyor", color: "bg-yellow-100 text-yellow-800" },
  shipped: { label: "Kargolandı", color: "bg-purple-100 text-purple-800" },
  delivered: {
    label: "Teslim Edildi",
    color: "bg-emerald-100 text-emerald-800",
  },
  completed: { label: "Tamamlandı", color: "bg-green-100 text-green-800" },
  cancelled: { label: "İptal Edildi", color: "bg-red-100 text-red-800" },
};

export default function StickyColumnsTable({
  customers,
  onDelete,
  onStatusUpdate,
}: StickyColumnsTableProps) {
  // Eğer customers boşsa mesaj göster
  if (!customers || customers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Müşteri bulunamadı</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="min-h-full">
        <Table className="border-separate border-spacing-0">
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="*:whitespace-nowrap hover:bg-background">
              <TableHead className="pl-4 sticky left-0 bg-background min-w-[60px] border-b border-r z-20">
                ID
              </TableHead>
              <TableHead className="sticky left-[60px] bg-background min-w-[160px] border-b border-r z-20">
                Firma Adı
              </TableHead>
              <TableHead className="min-w-[120px] border-b">Ad Soyad</TableHead>
              <TableHead className="min-w-[180px] border-b">Email</TableHead>
              <TableHead className="min-w-[140px] border-b">Telefon</TableHead>
              <TableHead className="min-w-[140px] border-b">Durum</TableHead>
              {/* STATUS HEADER */}
              <TableHead className="min-w-[120px] border-b">İl</TableHead>
              <TableHead className="min-w-[120px] border-b">İlçe</TableHead>
              <TableHead className="min-w-[220px] border-b">Adres</TableHead>
              <TableHead className="min-w-[140px] border-b">Sektör</TableHead>
              {/* 🔥 Multi-group gösterimi */}
              <TableHead className="min-w-[200px] border-b">
                Üretim Grupları
              </TableHead>
              {/* 🔥 Multi-product gösterimi */}
              <TableHead className="min-w-[320px] border-b">Ürünler</TableHead>
              <TableHead className="min-w-[140px] border-b">Tarih</TableHead>
              <TableHead className="min-w-[100px] border-b text-center">
                İşlem
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="overflow-hidden">
            {customers.map((customer, index) => (
              <TableRow
                key={customer.mongoId}
                className={`group [&>td]:whitespace-nowrap 
                hover:[&>td]:bg-blue-50 dark:hover:[&>td]:bg-blue-900/10
                ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
              >
                {/* ID */}
                <TableCell className="pl-4 sticky left-0 bg-inherit border-r z-10">
                  {customer.id}
                </TableCell>

                {/* Firma */}
                <TableCell className="sticky left-[60px] bg-inherit border-r z-10 font-medium">
                  {customer.companyName}
                </TableCell>

                <TableCell>
                  {customer.firstName} {customer.lastName}
                </TableCell>

                <TableCell>
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {customer.email}
                  </a>
                </TableCell>

                <TableCell>
                  <a
                    href={`tel:${customer.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {customer.phone}
                  </a>
                </TableCell>

                {/* STATUS CELL */}
                <TableCell>
                  <Select
                    defaultValue={customer.status}
                    onValueChange={(val) =>
                      onStatusUpdate?.(customer.mongoId, val)
                    }
                  >
                    <SelectTrigger
                      className={cn(
                        "h-8 w-[140px] border-0 text-xs font-medium focus:ring-0 focus:ring-offset-0",
                        statusMap[customer.status]?.color ||
                          "bg-gray-100 text-gray-800"
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusMap).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full",
                                config.color.split(" ")[0].replace("bg-", "bg-") // Basit renk dot'ı
                              )}
                            />
                            {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell>{customer.province || "-"}</TableCell>
                <TableCell>{customer.district || "-"}</TableCell>
                <TableCell>{customer.address}</TableCell>

                {/* Sektör */}
                <TableCell>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {customer.sector}
                  </span>
                </TableCell>

                {/* 🔥 Multi-group */}
                <TableCell>
                  <span
                    className="truncate block max-w-[180px]"
                    title={customer.productionGroups}
                  >
                    {customer.productionGroups}
                  </span>
                </TableCell>

                {/* 🔥 Multi-product */}
                <TableCell>
                  <span
                    className="truncate block max-w-[300px]"
                    title={customer.products}
                  >
                    {customer.products}
                  </span>
                </TableCell>

                <TableCell>{customer.tarih}</TableCell>

                {/* Delete */}
                <TableCell className="text-center">
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(customer)}
                    >
                      Sil
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
