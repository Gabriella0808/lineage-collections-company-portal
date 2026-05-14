import { useEffect, useMemo, useState } from "react";
import {
  Search, Package, ImageOff, X, ChevronLeft, ChevronRight,
  ShoppingCart, Tag, Box, DollarSign,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  category: string | null;
  collection: string | null;
  description: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  base_price: number | null;
  stock_status: string | null;
  inventory_level: number | null;
};

const PAGE_SIZE = 24;

function formatPrice(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function ProductImage({ src, alt }: { src: string | null; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className="aspect-square w-full bg-muted/40 flex items-center justify-center text-muted-foreground">
        <ImageOff className="h-10 w-10 opacity-40" />
      </div>
    );
  }
  return (
    <div className="aspect-square w-full bg-muted/20 overflow-hidden flex items-center justify-center">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setErrored(true)}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

function ProductDetailDrawer({
  product, open, onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  const [activeImg, setActiveImg] = useState(0);
  const images = product?.image_urls?.length ? product.image_urls : (product?.image_url ? [product.image_url] : []);

  useEffect(() => { if (open) setActiveImg(0); }, [open, product?.id]);

  if (!product) return null;

  const oos = (product.inventory_level ?? 0) <= 0;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        <div className="relative bg-muted/30">
          {images.length > 0 ? (
            <div className="aspect-[4/3] w-full bg-white flex items-center justify-center overflow-hidden">
              <img
                src={images[activeImg]}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="aspect-[4/3] w-full bg-muted/40 flex items-center justify-center text-muted-foreground">
              <ImageOff className="h-12 w-12 opacity-40" />
            </div>
          )}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setActiveImg((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setActiveImg((i) => (i + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          {oos && (
            <span className="absolute top-3 left-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-destructive text-destructive-foreground shadow-sm">
              Out of Stock
            </span>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 px-6 pt-4 overflow-x-auto">
            {images.map((url, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={cn(
                  "h-14 w-14 rounded-md border-2 overflow-hidden flex-shrink-0",
                  i === activeImg ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                )}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-6 space-y-5">
          <SheetHeader className="space-y-1 text-left p-0">
            <div className="text-[11px] tracking-wider text-muted-foreground uppercase">{product.sku}</div>
            <SheetTitle className="font-serif text-2xl leading-tight">{product.name}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-wrap gap-2">
            {product.brand && <Badge variant="secondary" className="rounded-full">{product.brand}</Badge>}
            {product.collection && <Badge variant="outline" className="rounded-full">{product.collection}</Badge>}
            {product.category && <Badge variant="outline" className="rounded-full">{product.category}</Badge>}
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                Price
              </div>
              <div className="text-lg font-semibold">{formatPrice(product.base_price)}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Box className="h-3.5 w-3.5" />
                Stock
              </div>
              <div className={cn("text-sm font-medium", oos ? "text-destructive" : "text-success")}>
                {oos ? "Out of Stock" : `${product.inventory_level} in stock`}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                Status
              </div>
              <div className="text-sm font-medium capitalize">{product.stock_status ?? "—"}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShoppingCart className="h-3.5 w-3.5" />
                SKU
              </div>
              <div className="text-sm font-medium">{product.sku}</div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string>("all");
  const [collection, setCollection] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, sku, name, brand, category, collection, description, image_url, image_urls, base_price, stock_status, inventory_level")
        .eq("is_active", true)
        .order("name", { ascending: true })
        .limit(1000);
      if (!cancelled) {
        if (!error && data) setProducts(data as Product[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const brands = useMemo(() => {
    const s = new Set<string>();
    for (const p of products) if (p.brand) s.add(p.brand);
    return Array.from(s).sort();
  }, [products]);

  const collections = useMemo(() => {
    const s = new Set<string>();
    for (const p of products) if (p.collection) s.add(p.collection);
    return Array.from(s).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (brand !== "all" && p.brand !== brand) return false;
      if (collection !== "all" && p.collection !== collection) return false;
      if (q) {
        const hay = `${p.sku} ${p.name} ${p.brand ?? ""} ${p.collection ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, query, brand, collection]);

  useEffect(() => { setPage(1); }, [query, brand, collection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openProduct = (p: Product) => {
    setSelected(p);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Product Catalog</h1>
        <p className="page-subtitle">
          Synced from BigCommerce · {products.length.toLocaleString()} products
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products or SKU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger className="w-full md:w-56 h-10"><SelectValue placeholder="Brand" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={collection} onValueChange={setCollection}>
            <SelectTrigger className="w-full md:w-56 h-10"><SelectValue placeholder="Collection" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All collections</SelectItem>
              {collections.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          {loading ? "Loading…" : `${filtered.length.toLocaleString()} products found`}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {paged.map((p) => {
          const oos = (p.inventory_level ?? 0) <= 0;
          return (
            <button
              key={p.id}
              onClick={() => openProduct(p)}
              className="text-left"
            >
              <Card className="overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-shadow">
                <div className="relative">
                  <ProductImage src={p.image_url} alt={p.name} />
                  {oos && (
                    <span className="absolute top-3 left-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-destructive text-destructive-foreground shadow-sm">
                      Out of Stock
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="text-[11px] tracking-wider text-muted-foreground uppercase">{p.sku}</div>
                  <h3 className="font-serif text-lg leading-snug mt-1 line-clamp-2">{p.name}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.brand && <Badge variant="secondary" className="rounded-full font-normal">{p.brand}</Badge>}
                    {p.collection && <Badge variant="outline" className="rounded-full font-normal">{p.collection}</Badge>}
                  </div>
                  {p.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.description}</p>
                  )}
                  <div className="mt-auto pt-4 flex items-baseline justify-between">
                    <span className="text-xl font-semibold">{formatPrice(p.base_price)}</span>
                    {p.inventory_level != null && p.inventory_level > 0 && (
                      <span className="text-xs text-muted-foreground">{p.inventory_level} in stock</span>
                    )}
                  </div>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          <Package className="h-10 w-10 mx-auto opacity-40 mb-3" />
          No products match your filters.
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={cn("px-3 py-1.5 rounded-md text-sm border", currentPage === 1 ? "opacity-40" : "hover:bg-muted")}
          >Previous</button>
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={cn("px-3 py-1.5 rounded-md text-sm border", currentPage === totalPages ? "opacity-40" : "hover:bg-muted")}
          >Next</button>
        </div>
      )}

      <ProductDetailDrawer
        product={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
