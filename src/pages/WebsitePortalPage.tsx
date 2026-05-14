import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe, Users, Mail, BookOpen, Boxes, FileImage, Heart, Megaphone,
  MapPinned, Tag, ShoppingCart, Layers, RefreshCw, Lock, Percent, FileText,
} from "lucide-react";

type Status = "live" | "planned" | "in-discussion";

const statusStyle: Record<Status, string> = {
  live: "bg-emerald-100 text-emerald-800 border-emerald-200",
  planned: "bg-amber-100 text-amber-800 border-amber-200",
  "in-discussion": "bg-slate-100 text-slate-700 border-slate-200",
};

type Item = {
  title: string;
  status: Status;
  description: string;
  link?: { to: string; label: string };
};

type Section = {
  id: string;
  icon: typeof Globe;
  title: string;
  intro: string;
  items: Item[];
};

const SECTIONS: Section[] = [
  {
    id: "consumer",
    icon: Globe,
    title: "Consumer Website",
    intro: "Public-facing experience for end consumers browsing Lineage brands.",
    items: [
      { title: "Nice catalog flow", status: "live", description: "Browse products by brand, collection, category with search and filters.", link: { to: "/catalog", label: "Open Catalog" } },
      { title: "Inventory (open to public)", status: "live", description: "Live inventory levels visible without login.", link: { to: "/inventory", label: "Open Inventory" } },
      { title: "Concise product layout", status: "planned", description: "Tighten product detail page — info currently spread over too much area; reduce image size, condense copy." },
      { title: "Related Products on PDP", status: "planned", description: "Recommend products from the same collection or category beneath each product." },
      { title: "Suggested lamps per bedroom collection", status: "planned", description: "Curated cross-sell: when viewing a nightstand/bedroom set, surface matching Lux Lighting lamps." },
      { title: "Cross-sell suggestions", status: "planned", description: "Show 'goes well with' items (e.g., lamps with nightstands) while browsing." },
      { title: "Option pricing fix", status: "planned", description: "Variant selection (size, finish) must update price reactively. Currently price doesn't change." },
      { title: "MSRP wording", status: "in-discussion", description: "Develop consumer-friendly language for MSRP vs dealer price disclosure." },
      { title: "Image / copy formatting", status: "planned", description: "Audit current site: pictures too large, too much text. Establish layout and content rules." },
      { title: "Mobile versions", status: "planned", description: "Full responsive parity for every consumer page." },
      { title: "Reference: Universal Furniture", status: "in-discussion", description: "Use Universal's site as a benchmark — login is shared internally." },
    ],
  },
  {
    id: "dealer-locator",
    icon: MapPinned,
    title: "Dealer Locator & Consumer Cart",
    intro: "Bridge consumers to nearby dealers without bypassing the dealer relationship.",
    items: [
      { title: "Zip-code dealer locator", status: "planned", description: "Consumers browse, see ballpark pricing, and find a nearby dealer." },
      { title: "Build & send cart to dealer", status: "planned", description: "Consumer assembles a cart and routes it to the nearest dealer for a quote." },
    ],
  },
  {
    id: "marketing",
    icon: Megaphone,
    title: "Marketing & Content",
    intro: "Promotions, campaigns, and content surfaces.",
    items: [
      { title: "Promo banners", status: "planned", description: "Configurable banner system across consumer site for promotions and campaigns." },
      { title: "Mailchimp newsletter signup", status: "planned", description: "Multiple capture points across the site auto-add consumers to Mailchimp; allow re-subscribe." },
      { title: "Link to digital catalog", status: "planned", description: "Prominent link to the downloadable / flip-book digital catalog." },
      { title: "Charity page", status: "planned", description: "Dedicated page for Lineage's charitable work." },
      { title: "Media library link", status: "planned", description: "Public link to images and videos consumers and partners can browse." },
    ],
  },
  {
    id: "amp",
    icon: Lock,
    title: "Dealer Portal (AMP-style)",
    intro: "Authenticated dealer experience replacing/augmenting AMP.",
    items: [
      { title: "Dealer login with discount levels", status: "planned", description: "Each dealer signs in and sees their allowable discount tiers (regular, container, etc.) — multiple tiers visible at once." },
      { title: "Apply for a login", status: "planned", description: "Self-service application flow for prospective dealers." },
      { title: "Live inventory levels", status: "live", description: "Inventory feed already wired from Acctivate.", link: { to: "/inventory", label: "Open Inventory" } },
      { title: "Order history & open orders", status: "planned", description: "Dealers see purchase history and what's currently on order." },
      { title: "Volume discount preview", status: "planned", description: "Show dealers what they'd save if they bumped to the next tier (extra discount at higher volume)." },
      { title: "Auto-push orders to QuickBooks", status: "planned", description: "Web orders flow into QB Enterprise as estimates or sales orders pending review." },
      { title: "Multi-level QB sync", status: "planned", description: "Inventory, orders, customers, pricing — bidirectional with QB Enterprise." },
    ],
  },
  {
    id: "discounts",
    icon: Percent,
    title: "Hidden / Targeted Discount Programs",
    intro: "Discount programs visible only to qualified customers.",
    items: [
      { title: "Bulk warehouse program", status: "planned", description: "e.g., 12% off when buying X cubes. Offer is hidden from general dealer audience." },
      { title: "Audience targeting", status: "planned", description: "Per-customer / per-group visibility rules — distinct from baseline dealer discount tiers." },
    ],
  },
  {
    id: "reps",
    icon: Users,
    title: "Sales Rep Tools",
    intro: "Field-rep workflows on top of the dealer portal.",
    items: [
      { title: "Presentations & quotes", status: "planned", description: "Reps select products, build a presentation, send a quote — like AMP today." },
      { title: "Quote Cart", status: "live", description: "Internal quote cart to send to dealers.", link: { to: "/cart", label: "Open Quote Cart" } },
      { title: "Territory dealer view", status: "live", description: "Reps see dealers in their assigned territory.", link: { to: "/dealers", label: "Open My Dealers" } },
      { title: "Dealer product-line history", status: "planned", description: "Per-dealer view of which Lineage product lines they're buying or have bought." },
      { title: "Asset library", status: "planned", description: "All photos, videos, and social assets accessible to reps and dealers." },
    ],
  },
];

export default function WebsitePortalPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [hash]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full text-[10px] uppercase tracking-[0.18em]">
            Website & Portal Roadmap
          </Badge>
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Website & Customer Portal Plan
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Consolidated scope for the consumer website, dealer portal (AMP replacement), and rep tooling.
          Items marked <em>live</em> already exist in this portal; <em>planned</em> items are queued for build.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 pb-2 border-b">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="text-xs px-3 py-1.5 rounded-full border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {s.title}
          </a>
        ))}
      </nav>

      {SECTIONS.map((section) => {
        const Icon = section.icon;
        return (
          <section key={section.id} id={section.id} className="scroll-mt-20 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">{section.title}</h2>
                <p className="text-sm text-muted-foreground">{section.intro}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {section.items.map((item) => (
                <Card key={item.title} className="border-border/70">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base font-medium">{item.title}</CardTitle>
                      <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${statusStyle[item.status]}`}>
                        {item.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    {item.link && (
                      <Link
                        to={item.link.to}
                        className="inline-flex text-xs font-medium text-primary hover:underline"
                      >
                        {item.link.label} →
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// Unused icon imports kept tree-shaken away
void [Mail, BookOpen, Boxes, FileImage, Heart, Tag, ShoppingCart, Layers, RefreshCw, FileText];
