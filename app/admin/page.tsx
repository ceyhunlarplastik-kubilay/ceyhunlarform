import { redirect } from "next/navigation";
import Link from "next/link";
import { checkRole } from "@/utils/roles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppBreadcrumb } from "@/components/breadcrumbs/AppBreadcrumb";
import {
  AlertCircle,
  LayoutDashboard,
  Package,
  Layers,
  Home,
} from "lucide-react";

export default async function AdminDashboard() {
  // RBAC: enforce admin only
  if (!(await checkRole("admin"))) {
    redirect("/");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <AppBreadcrumb
          items={[{ label: "Ana Sayfa", href: "/" }, { label: "Admin" }]}
        />
        <h1 className="text-3xl font-bold">Admin Paneli</h1>
        <p className="text-muted-foreground mt-2">
          İçerik yönetim sistemine hoş geldiniz. Buradan sektörleri, üretim
          gruplarını ve ürünleri yönetebilirsiniz.
        </p>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Site */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-6 w-6 text-blue-500" />
              Ana Sayfa
            </CardTitle>
            <CardDescription>
              Müşterilerin gördüğü ana sayfaya git
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/">Siteye Git</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Sectors */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-6 w-6 text-green-500" />
              Sektör Yönetimi
            </CardTitle>
            <CardDescription>
              Sektörleri ekle, düzenle veya sil. Sektör görsellerini buradan
              yönetebilirsin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              variant="outline"
              className="w-full border-green-200 hover:bg-green-50 hover:text-green-700"
            >
              <Link href="/admin/sectors">Sektörleri Yönet</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Production Groups */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-orange-500" />
              Üretim Grupları
            </CardTitle>
            <CardDescription>
              Sektörlere bağlı üretim gruplarını yönet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              variant="outline"
              className="w-full border-orange-200 hover:bg-orange-50 hover:text-orange-700"
            >
              <Link href="/admin/production-groups">Grupları Yönet</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Products */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6 text-purple-500" />
              Endüstriyel Ürün Yönetimi
            </CardTitle>
            <CardDescription>
              Üretim gruplarına bağlı endüstriyel ürünleri yönet. Ürün
              görsellerini buradan ekleyebilirsin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              variant="outline"
              className="w-full border-purple-200 hover:bg-purple-50 hover:text-purple-700"
            >
              <Link href="/admin/products">Endüstriyel Ürünleri Yönet</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6 text-purple-500" />
              Müşteriler
            </CardTitle>
            <CardDescription>
              Numune talep eden müşterileri yönet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              variant="outline"
              className="w-full border-purple-200 hover:bg-purple-50 hover:text-purple-700"
            >
              <Link href="/admin/customers">Müşterileri Yönet</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 text-amber-800">
        <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
        <div className="space-y-2 text-sm">
          <h4 className="font-semibold">Silme İşlemi Hakkında Önemli Bilgi</h4>
          <p>
            Veri bütünlüğünü korumak amacıyla silme işlemleri hiyerarşik bir
            sıra izlemelidir:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-1 opacity-90">
            <li>
              Bir <strong>Sektör</strong> silinmeden önce, o sektöre ait tüm
              ürünler ve üretim grupları silinmelidir.
            </li>
            <li>
              Bir <strong>Üretim Grubu</strong> silinmeden önce, o gruba ait tüm
              ürünler silinmelidir.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
