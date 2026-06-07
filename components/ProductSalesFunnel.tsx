"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Product, type Spec, type Feature, type Package, type SiteSettings, type Review, type FAQ, type GalleryImage } from "@/lib/cms-types";
import { db } from "@/lib/cms-types";
import { trackMetaEvent } from "@/lib/meta-pixel";
import {
  CheckCircle2, Phone, MessageCircle, ShieldCheck, BatteryFull, Sun, Award, Truck, Lock, Star,
  Zap, Droplet, Wrench, Leaf, Flame, Package as PackageIcon, AlertTriangle, Clock, ChevronLeft, ChevronRight,
  HelpCircle, MapPin, Eye, Check, ChevronDown, ChevronUp,
  type LucideIcon,
} from "lucide-react";

const STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River",
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna",
  "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const ICONS: Record<string, LucideIcon> = {
  Sun, Award, BatteryFull, ShieldCheck, Zap, Droplet, Wrench, Leaf, Truck, Lock, Star, CheckCircle2,
};

/* ---------- Countdown ---------- */
function useCountdown() {
  const getTarget = () => { const t = new Date(); t.setHours(23, 59, 59, 999); return t.getTime(); };
  const [target, setTarget] = useState(getTarget);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => { const n = Date.now(); setNow(n); if (n >= target) setTarget(getTarget()); }, 1000);
    return () => clearInterval(id);
  }, [target]);
  const diff = Math.max(0, target - now);
  return {
    h: String(Math.floor(diff / 3.6e6)).padStart(2, "0"),
    m: String(Math.floor((diff % 3.6e6) / 6e4)).padStart(2, "0"),
    s: String(Math.floor((diff % 6e4) / 1000)).padStart(2, "0"),
  };
}

function FlipCell({ v, l }: { v: string; l: string }) {
  return (
    <div className="flex min-w-[50px] flex-col items-center rounded-lg bg-slate-900 px-2.5 py-1 text-white border border-white/10 sm:min-w-[64px]">
      <span className="text-xl font-black tabular-nums sm:text-2xl text-emerald-400">{v}</span>
      <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{l}</span>
    </div>
  );
}

function CountdownPill({ tone = "dark" }: { tone?: "dark" | "danger" }) {
  const { h, m, s } = useCountdown();
  const wrap = tone === "danger"
    ? "border-rose-500/25 bg-rose-500/10 text-rose-300"
    : "border-slate-800 bg-slate-900/50 text-slate-300";
  return (
    <div className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 sm:px-4 ${wrap}`}>
      <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider sm:text-sm">
        <Clock className="h-4 w-4 text-emerald-400 animate-pulse" /> Offer ends in:
      </span>
      <div className="flex gap-1"><FlipCell v={h} l="HR" /><FlipCell v={m} l="MIN" /><FlipCell v={s} l="SEC" /></div>
    </div>
  );
}

/* ---------- Sticky mobile CTA ---------- */
function StickyCTA({ phone, whatsapp, ctaText }: { phone: string; whatsapp: string; ctaText: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur lg:hidden p-2.5">
      <div className="mx-auto flex max-w-md items-center gap-2">
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}`} onClick={() => trackMetaEvent("Contact", { method: "WhatsApp Sticky CTA" })} target="_blank" rel="noopener noreferrer" className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 transition">
            <MessageCircle className="h-5 w-5" />
          </a>
        )}
        {phone && (
          <a href={`tel:${phone}`} onClick={() => trackMetaEvent("Contact", { method: "Phone Sticky CTA" })} className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 transition">
            <Phone className="h-5 w-5" />
          </a>
        )}
        <a href="#order" onClick={() => trackMetaEvent("InitiateCheckout", { position: "Sticky CTA" })} className="lit-cta flex h-14 flex-1 items-center justify-center gap-2 rounded-xl px-6 text-base font-black tracking-wide text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:brightness-110 shadow-2xl shadow-emerald-500/40 active:scale-[0.97] transition-all duration-200 animate-pulse">
          <CheckCircle2 className="h-5 w-5" />
          {ctaText}
        </a>
      </div>
    </div>
  );
}

/* ---------- Video Player helper ---------- */
function VideoPlayer({ url, poster }: { url: string; poster?: string }) {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let embedUrl = url;
    if (url.includes("watch?v=")) {
      const id = url.split("v=")[1]?.split("&")[0];
      embedUrl = `https://www.youtube.com/embed/${id}`;
    } else if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      embedUrl = `https://www.youtube.com/embed/${id}`;
    }
    return (
      <div className="relative aspect-square sm:aspect-video w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-black">
        <iframe src={embedUrl} className="absolute inset-0 h-full w-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  return (
    <video controls preload="metadata" playsInline poster={poster} className="w-full aspect-square sm:aspect-video rounded-3xl object-cover shadow-2xl border border-white/10 bg-black">
      <source src={url} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
}

/* ---------- FAQ Accordion ---------- */
function FAQAccordionItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-slate-800 bg-slate-900/40 backdrop-blur rounded-2xl overflow-hidden transition-all duration-200">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-200 hover:text-white transition">
        <span>{faq.question}</span>
        {isOpen ? <ChevronUp className="h-5 w-5 text-emerald-400" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 border-t border-slate-800" : "max-h-0"}`}>
        <p className="p-5 text-sm text-slate-400 leading-relaxed bg-slate-950/20">{faq.answer}</p>
      </div>
    </div>
  );
}

export type SalesFunnelProps = {
  product: Product;
  specs: Spec[];
  features: Feature[];
  packages: Package[];
  settings: SiteSettings | null;
  reviews: Review[];
  faqs: FAQ[];
  images: GalleryImage[];
};

export default function ProductSalesFunnel({
  product,
  specs,
  features,
  packages,
  settings,
  reviews,
  faqs,
  images,
}: SalesFunnelProps) {
  const [activeTab, setActiveTab] = useState<"all" | "gallery" | "before_after" | "installation">("all");

  const phone = settings?.phone ?? "";
  const whatsapp = settings?.whatsapp ?? "";
  const email = settings?.email ?? "";

  // Dynamic values with fallbacks
  const tagline = product.tagline || "Pay On Delivery Nationwide";
  const heroHeadline = product.hero_headline || "Light Your Whole Compound — Without NEPA.";
  const heroSubheadline = product.hero_subheadline || "Die-cast aluminium · 25,000mAh · 5-Year Warranty · Pay On Delivery";
  const stockStatus = product.stock_status || "Only 14 units left at promo price";
  const heroCtaText = product.hero_cta_text || "✅ Order Now — Pay On Delivery";

  const heroList = useMemo(() => {
    if (product.hero_description) {
      return product.hero_description.split("\n").filter(Boolean);
    }
    return [
      "Die-cast aluminium body",
      "25,000mAh lithium battery",
      "Dusk-to-dawn brightness",
      "5-Year warranty",
      "Pay on delivery nationwide",
    ];
  }, [product.hero_description]);

  // Pricing calculations
  const unitPrice = product.price ?? (packages[0] ? Math.round(packages[0].price / packages[0].quantity) : 35000);
  const regularPrice = product.discount_price ?? Math.round(unitPrice / 0.7);

  // Gallery categorization
  const combinedSlides = useMemo(() => {
    const list: { url: string; label: string; type: string }[] = [];
    if (product.hero_image_url) list.push({ url: product.hero_image_url, label: "HERO PRODUCT", type: "gallery" });
    if (product.packaging_image_url) list.push({ url: product.packaging_image_url, label: "PACKAGING", type: "gallery" });
    if (product.night_image_url) list.push({ url: product.night_image_url, label: "INSTALLED AT NIGHT", type: "installation" });
    if (product.specs_image_url) list.push({ url: product.specs_image_url, label: "SPECS SHOT", type: "gallery" });

    images.forEach((img) => {
      list.push({ url: img.url, label: img.alt || "Gallery Image", type: img.image_type || "gallery" });
    });
    return list;
  }, [product, images]);

  const filteredSlides = useMemo(() => {
    if (activeTab === "all") return combinedSlides;
    return combinedSlides.filter((s) => s.type === activeTab);
  }, [combinedSlides, activeTab]);

  // Reviews fallback
  const finalReviews = useMemo(() => {
    if (reviews && reviews.length > 0) return reviews;
    return [
      { id: "1", customer_name: "Mary Okonkwo", customer_location: "Lagos", rating: 5, review_text: "Excellent product. The brightness is amazing — covers my whole compound. Delivered next day, I paid on delivery. No wahala.", customer_photo_url: null, sort_order: 1, created_at: "" },
      { id: "2", customer_name: "John Eze", customer_location: "Enugu", rating: 5, review_text: "Like my own security guard at night. Even when it rained for 3 days straight, the light still came on. Quality is solid.", customer_photo_url: null, sort_order: 2, created_at: "" },
      { id: "3", customer_name: "Ubom Effiong", customer_location: "Calabar", rating: 5, review_text: "I was sceptical because of online scams. But they called me, delivered, I paid cash and inspected. Works perfectly.", customer_photo_url: null, sort_order: 3, created_at: "" },
    ];
  }, [reviews]);

  // FAQs fallback
  const finalFaqs = useMemo(() => {
    if (faqs && faqs.length > 0) return faqs;
    return [
      { id: "1", product_id: product.id, question: "Does it charge on cloudy or rainy days?", answer: "Yes, the high-efficiency monocrystalline solar panel is designed to charge even in low light, harmattan haze, or cloudy/rainy weather. The battery store lasts up to 2-3 nights.", sort_order: 1, created_at: "" },
      { id: "2", product_id: product.id, question: "How long does the installation take?", answer: "It takes less than 10 minutes. There is no wiring required. Simply mount the solar light on a pole or wall using the included bracket and screws.", sort_order: 2, created_at: "" },
      { id: "3", product_id: product.id, question: "What does the 5-Year warranty cover?", answer: "The warranty covers any factory defect or complete failure of the solar panel, LEDs, or battery. We replace the light for free within the warranty period.", sort_order: 3, created_at: "" },
      { id: "4", product_id: product.id, question: "How do I pay?", answer: "We offer Pay On Delivery nationwide. You only pay when the delivery agent brings the product to your door, and you can inspect it first.", sort_order: 4, created_at: "" },
    ];
  }, [faqs, product.id]);

  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const galleryBlock = (
    <div className="space-y-4">
      <GalleryCarousel slides={filteredSlides} />

      <div className="flex flex-wrap gap-1.5 justify-center rounded-xl bg-slate-900/60 p-1 border border-slate-800">
        {[
          { id: "all", label: "All Photos" },
          { id: "gallery", label: "Product" },
          { id: "before_after", label: "Before/After" },
          { id: "installation", label: "Installation" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${activeTab === tab.id
                ? "bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black"
                : "text-slate-400 hover:text-white"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-6 pb-12 sm:py-16 lg:py-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full bg-teal-500/5 blur-[120px]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[1.1fr_1fr_0.9fr] lg:items-start lg:gap-7">

          {/* LEFT col: Copy */}
          <div className="space-y-5">
            <h1 className="text-4xl font-black uppercase tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent leading-tight sm:text-5xl lg:text-6xl drop-shadow-[0_2px_10px_rgba(16,185,129,0.25)]">
              {product.title}
            </h1>
            <a href="#order" onClick={() => trackMetaEvent("InitiateCheckout", { position: "Hero Title" })} className="lit-cta inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 px-8 py-3.5 text-lg font-black text-slate-950 hover:brightness-110 shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 active:scale-[0.97] transition-all duration-200 animate-pulse sm:w-auto">
              <CheckCircle2 className="h-5 w-5" /> I Want To Buy Now
            </a>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-400">
              {tagline}
            </p>
            <p className="text-lg text-slate-300 leading-relaxed font-medium">
              {heroSubheadline}
            </p>
            {product.short_description && (
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                {product.short_description}
              </p>
            )}
            <div className="lg:hidden">
              {galleryBlock}
            </div>
            <ul className="space-y-3 pt-2">
              {heroList.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-base text-slate-200">
                  <div className="flex-none rounded-full bg-emerald-500/15 p-1 text-emerald-400 border border-emerald-500/20">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </div>
                  <span className="font-semibold">{item}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4">
              <a href="#order" onClick={() => trackMetaEvent("InitiateCheckout", { position: "Hero Section" })} className="lit-cta inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 px-10 py-5 text-lg font-black text-white hover:brightness-110 shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 active:scale-[0.97] transition-all duration-200 animate-pulse sm:w-auto">
        <CheckCircle2 className="h-6 w-6" />
        {heroCtaText}
      </a>
            </div>
          </div>

          {/* MIDDLE col: Image Gallery */}
          <div className="hidden lg:block">{galleryBlock}</div>

          {/* RIGHT col: Pricing Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-2xl backdrop-blur">

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Discount Price</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/25">
                <Flame className="h-3.5 w-3.5 fill-amber-400" /> Selling Fast
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500 line-through">₦{regularPrice.toLocaleString()}/unit</p>
            <p className="text-4xl font-black tracking-tight text-emerald-400 leading-none">
              ₦{unitPrice.toLocaleString()}
              <span className="text-sm font-semibold text-slate-400"> / unit</span>
            </p>
            <p className="mt-2 text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 text-center uppercase tracking-wide">
              {stockStatus}
            </p>

            <div className="mt-5 space-y-2.5">
              {packages.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 px-3 py-2.5 text-xs text-slate-300">
                  <span className="font-semibold">{p.title}</span>
                  <span className="font-black text-emerald-400">₦{p.price.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-2">
              <a href="#order" onClick={() => trackMetaEvent("InitiateCheckout", { position: "Pricing Card" })} className="lit-cta flex items-center justify-center gap-2 rounded-xl py-4 px-5 text-sm font-black text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:brightness-110 active:scale-[0.97] transition-all duration-200 shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="h-5 w-5" />
                Order Now — Pay On Delivery
              </a>
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp}`} onClick={() => trackMetaEvent("Contact", { method: "WhatsApp Pricing Card" })} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-xs font-black text-slate-300 hover:bg-slate-800 hover:text-white transition">
                  <MessageCircle className="h-4 w-4 text-emerald-400 fill-emerald-400/10" /> Chat On WhatsApp
                </a>
              )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-1.5 text-center text-[9px] font-black uppercase tracking-wider text-slate-400 border-t border-slate-800 pt-4">
              <div className="rounded-lg bg-slate-900/30 p-2 border border-slate-900"><ShieldCheck className="mx-auto mb-1 h-4 w-4 text-emerald-400" />5-YR Wty</div>
              <div className="rounded-lg bg-slate-900/30 p-2 border border-slate-900"><Truck className="mx-auto mb-1 h-4 w-4 text-emerald-400" />Free Ship</div>
              <div className="rounded-lg bg-slate-900/30 p-2 border border-slate-900"><Lock className="mx-auto mb-1 h-4 w-4 text-emerald-400" />Pay On Del</div>
            </div>

            <div className="mt-5"><CountdownPill tone="danger" /></div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-300 font-bold border-t border-slate-800/60 pt-3">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 4.9 · 3,400+ Nigerian homes lit up
            </div>
          </div>
        </div>
      </section>

      {/* STATS TRUST BAR */}
      <section className="border-y border-slate-900 bg-slate-950 relative z-10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-10 sm:grid-cols-4">
          {[
            { v: "3,400+", l: "Compounds Illuminated" },
            { v: "4.9 ★", l: "Verified Happy Buyers" },
            { v: "1–3 Days", l: "Fast Nationwide Shipping" },
            { v: "5 Years", l: "Ironclad Free Warranty" },
          ].map((s) => (
            <div key={s.l} className="text-center group p-3 bg-slate-900/10 border border-slate-900 rounded-2xl hover:border-emerald-500/20 hover:bg-slate-900/20 transition-all">
              <p className="text-3xl font-black text-emerald-400 tracking-tight sm:text-4xl">{s.v}</p>
              <p className="mt-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 sm:text-xs">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ZERO BILLS SECTION (SECTION 2) */}
      <section className="bg-slate-900/10 py-20 border-y border-slate-900 relative">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl opacity-10 blur-xl group-hover:opacity-15 transition" />
            <SlotImage src={product.packaging_image_url} label="IMAGE 2 — PACKAGING" className="aspect-square w-full rounded-3xl border border-slate-800 object-cover relative z-10" />
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
              {product.bills_section_title || "One Light. Zero Bills. Zero Stress."}
            </h2>
            <p className="text-base text-slate-400 leading-relaxed font-medium sm:text-lg">
              {product.bills_section_description || "Charges by day. Lights your space all night. Automatic — no switch, no wiring, no electrician. Just mount it and forget NEPA forever."}
            </p>
            <ul className="space-y-3 pt-2">
              {(() => {
                const defaultItems = [
                  "Compounds, gates, streets, farms, car parks, churches",
                  "Waterproof (IP67) — works through the heaviest rainy season",
                  "Installs in minutes — no wiring, no electrician needed",
                  "Lights up automatically the moment the sun goes down",
                ];
                const items = product.bills_section_list
                  ? product.bills_section_list.split("\n").filter(Boolean)
                  : defaultItems;
                return items.map((t, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-300">
                    <div className="mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                    <span className="font-semibold text-slate-200">{t}</span>
                  </li>
                ));
              })()}
            </ul>
            <div className="pt-4">
              <a href="#order" onClick={() => trackMetaEvent("InitiateCheckout", { position: "Zero Bills Section" })} className="lit-cta inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 px-10 py-5 text-lg font-black text-white hover:brightness-110 shadow-2xl shadow-emerald-500/40 active:scale-[0.97] transition-all duration-200 animate-pulse">
                <CheckCircle2 className="h-6 w-6" />
                Yes — I Want Mine →
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* DYNAMIC FEATURES (SECTION 3) */}
      <section className="py-20 bg-slate-950 relative overflow-hidden">
        <div className="pointer-events-none absolute left-10 top-1/2 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[120px]" />

        <div className="mx-auto max-w-6xl px-4 relative z-10">
          <div className="mx-auto max-w-2xl text-center space-y-3 mb-12">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              {product.features_section_title || "Why This Model Wins"}
            </h2>
            <p className="text-slate-400 font-medium">
              {product.features_section_subtitle || "Built to fix every complaint about cheap solar lights."}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(features.length ? features : [
              { id: "1", title: "Always On — No Sensor", description: "Steady light all night. Perfect for areas that need real illumination, not motion guessing.", icon: "Sun" },
              { id: "2", title: "Die-Cast Aluminium Body", description: "Real metal — not cheap plastic. Survives sun, rain, harmattan and impact.", icon: "Award" },
              { id: "3", title: "25,000mAh Battery", description: "5× 5,000mAh 32650 lithium cells. All-night brightness, even after cloudy days.", icon: "BatteryFull" },
              { id: "4", title: "5-Year Warranty", description: "If it fails within 5 years — we replace it. Real protection, in writing.", icon: "ShieldCheck" },
            ] as Feature[]).map((f) => {
              const I = (f.icon && ICONS[f.icon]) || Sun;
              return (
                <div key={f.id} className="group rounded-2xl border border-slate-850 bg-slate-900/30 p-6 shadow-xl transition-all duration-350 hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-slate-900/50">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition duration-300">
                    <I className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition">{f.title}</h3>
                  {f.description && <p className="mt-2.5 text-sm text-slate-400 leading-relaxed font-medium">{f.description}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* REAL SECURITY MEDIA SECTION (SECTION 4) */}
      <section className="bg-slate-950 py-20 relative overflow-hidden">
        <div className="pointer-events-none absolute right-10 top-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />

        <div className="mx-auto max-w-6xl px-4 relative z-10">
          <div className="mx-auto max-w-2xl text-center space-y-3 mb-12">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
              {product.security_section_title || "Real Light. Real Security."}
            </h2>
            <p className="text-slate-400 font-medium">
              {product.security_section_description || "See how your compound looks after dark — bright, safe, alive."}
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
            {product.security_media_type === "video" && product.video_url ? (
              <VideoPlayer url={product.video_url} poster={product.night_image_url ?? undefined} />
            ) : (
              <SlotImage src={product.night_image_url} label="IMAGE 3 — INSTALLED AT NIGHT" dark className="aspect-square sm:aspect-[16/9] w-full rounded-3xl object-cover" />
            )}
          </div>

          <div className="mt-12 text-center">
            <a href="#order" onClick={() => trackMetaEvent("InitiateCheckout", { position: "Real Security Section" })} className="lit-cta inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 px-10 py-5 text-lg font-black text-white hover:brightness-110 shadow-2xl shadow-emerald-500/40 active:scale-[0.97] transition-all duration-200 animate-pulse">
              <CheckCircle2 className="h-6 w-6" />
              Secure Your Compound Now →
            </a>
          </div>
        </div>
      </section>

      <CtaBar
        kicker="READY TO LIGHT UP YOUR COMPOUND?"
        sub="Pay on delivery. Fast nationwide shipping. Limited stock at promo price."
        label={product.hero_cta_text || "Order Now"}
      />

      {/* SPECIFICATIONS TABLE (SECTION 5) */}
      <section className="bg-slate-900/20 py-20 border-y border-slate-900 relative">
        <div className="mx-auto max-w-6xl px-4 relative z-10">
          <div className="mx-auto max-w-2xl text-center space-y-3 mb-12">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
              {product.specs_section_title || "Full Specifications"}
            </h2>
            <p className="text-slate-400 font-medium">
              {product.specs_section_subtitle || "The right parts. No shortcuts."}
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-start max-w-5xl mx-auto">
            <SlotImage src={product.specs_image_url} label="IMAGE 4 — SPECS SHOT" className="aspect-[5/4] w-full rounded-3xl border border-slate-800 object-cover shadow-2xl" />

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40 backdrop-blur shadow-xl">
              <table className="w-full text-left text-sm">
                <tbody>
                  {(specs.length ? specs : [
                    { id: "a", label: "Material", value: "Die-cast Aluminium" },
                    { id: "b", label: "Battery", value: "5× 5,000mAh 32650 Lithium (25,000mAh)" },
                    { id: "c", label: "Light Source", value: "High-efficiency SMD LED" },
                    { id: "d", label: "Mode", value: "Dusk-to-dawn · Always On" },
                    { id: "e", label: "Charging", value: "Solar (built-in panel)" },
                    { id: "f", label: "Install Height", value: "5 – 6m recommended" },
                    { id: "g", label: "Warranty", value: "5 Years" },
                  ] as Spec[]).map((s) => (
                    <tr key={s.id} className="border-b border-slate-900/60 last:border-0 hover:bg-slate-900/25 transition">
                      <td className="bg-slate-900/30 px-5 py-4 font-bold text-slate-300 border-r border-slate-900/40 w-1/3">{s.label}</td>
                      <td className="px-5 py-4 text-slate-400 font-medium">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <CtaBar
        kicker="CHOOSE YOUR BUNDLE BELOW"
        sub="Select your package, fill the form, and we call to confirm."
        label="Proceed to Order Form"
      />

      {/* CUSTOMER TESTIMONIALS (SECTION 6) */}
      <section className="py-20 bg-slate-950 relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />

        <div className="mx-auto max-w-6xl px-4 relative z-10">
          <div className="mx-auto max-w-2xl text-center space-y-3 mb-12">
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-6 w-6 fill-amber-400 text-amber-400" />)}
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-white">4.9 / 5 Rating from Real Buyers</h2>
            <p className="text-slate-400 font-medium">Verified customer reviews from Nigerians who paid on delivery.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {finalReviews.map((r, idx) => (
              <div key={r.id || idx} className="rounded-3xl border border-slate-850 bg-slate-900/20 p-6 shadow-xl backdrop-blur relative hover:border-slate-800 transition duration-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-300 italic leading-relaxed font-medium">"{r.review_text}"</p>
                </div>

                <div className="flex items-center gap-3.5 border-t border-slate-900/80 pt-4 mt-6">
                  {r.customer_photo_url ? (
                    <Image src={r.customer_photo_url} alt={r.customer_name} width={44} height={44} className="h-11 w-11 rounded-full object-cover border border-slate-800" />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-sm font-black text-emerald-400 border border-slate-700">
                      {r.customer_name.split(" ").map((s) => s[0]).join("")}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-white text-sm">{r.customer_name}</p>
                    <p className="text-xs text-slate-500 font-bold flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-emerald-500" /> {r.customer_location || "Nigeria"} · Verified Buyer
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBar
        kicker="LOVED BY 3,400+ NIGERIANS — SECURE YOURS"
        sub="Order today and inspect the package before you pay cash."
        label="Order Now & Pay On Delivery"
      />

      {/* TODAY'S PROMO PRICE CARD */}
      <section className="py-20 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-3xl border-2 border-emerald-500/30 bg-slate-900/20 p-8 text-center shadow-2xl backdrop-blur relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />

            <span className="inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-400 shadow-md">
              Today's Promo Price
            </span>

            <p className="mt-5 text-sm text-slate-500 line-through">Regular: ₦{regularPrice.toLocaleString()}/unit</p>
            <p className="mt-1 text-5xl font-black text-emerald-400 tracking-tight sm:text-6xl">
              ₦{unitPrice.toLocaleString()}
              <span className="text-lg font-bold text-slate-300">/unit</span>
            </p>
            <p className="mt-2 text-xs font-black text-emerald-400 tracking-wider uppercase">
              + FREE delivery anywhere in Nigeria
            </p>

            <div className="my-6 border-t border-slate-800" />

            <p className="text-sm font-black uppercase tracking-wider flex items-center justify-center gap-1 text-slate-200">
              <PackageIcon className="h-4 w-4 text-emerald-400" /> Bulk Buyers Bonus Included
            </p>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed font-medium">
              Order 5+ units and get a FREE Rechargeable Bulb. Buy 10 pieces and get 2 FREE units.
            </p>

            <div className="mt-6 flex justify-center"><CountdownPill tone="danger" /></div>
          </div>

          {/* WARNING PLEASE READ BAR */}
          <div className="mt-12 overflow-hidden rounded-3xl border border-rose-500/20 bg-rose-950/10 backdrop-blur">
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 py-3 text-center text-xs font-black uppercase tracking-wider text-white shadow-md">
              <AlertTriangle className="h-4 w-4 text-white animate-bounce" /> Please Read Before Ordering
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-3 border-b border-rose-950/20">
              {[
                { i: Flame, t: "HIGH DEMAND", s: "27 people ordered today" },
                { i: PackageIcon, t: "LIMITED STOCK", s: "Only 14 units left today" },
                { i: Truck, t: "FREE SHIPPING", s: "1–3 days delivery nationwide" },
              ].map((b, i) => {
                const Ic = b.i;
                return (
                  <div key={i} className="flex items-start gap-3 rounded-2xl bg-rose-500/5 p-3.5 border border-rose-500/10">
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <Ic className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-rose-300">{b.t}</p>
                      <p className="text-[10px] text-rose-400/80 font-bold">{b.s}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <ul className="space-y-3 p-6 text-sm text-slate-400 leading-relaxed font-medium">
              {[
                "Don't order if you can't receive the package within 1–3 working days.",
                "If you are traveling out of town, please do not order now (unless someone else collects for you).",
                "Ensure you are financially prepared before submitting the form. Save our contact details if you need more time.",
                "Provide a working phone number that is reachable. We will call you to verify your address.",
                "If a family member or third party will pay, please align with them BEFORE submitting.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-2 inline-block h-1.5 w-1.5 flex-none rounded-full bg-rose-500" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            <div className="mx-6 mb-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3.5 text-center text-sm font-black text-emerald-400">
              ⚡ MINIMUM ORDER: 2 PIECES. Bulk buyers get free gifts and extra units.
            </div>

            <p className="px-6 pb-6 text-center text-[10px] font-black text-rose-400 uppercase tracking-widest animate-pulse">
              ⚠ ONLY SUBMIT THE ORDER FORM IF YOU ARE READY TO BUY NOW!
            </p>
          </div>

          {/* DYNAMIC CHECKOUT FORM */}
          <div id="order" className="mt-12 scroll-mt-6">
            <OrderForm
              packages={packages}
              whatsapp={whatsapp}
              email={email}
              phone={phone}
              product={product}
              images={images}
            />
          </div>
        </div>
      </section>

      {/* DYNAMIC FAQ ACCORDION (SECTION 8) */}
      <section className="bg-slate-900/10 py-20 border-y border-slate-900">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-white">Frequently Asked Questions</h2>
            <p className="text-slate-400 font-medium">Have questions before buying? Find quick answers here.</p>
          </div>

          <div className="space-y-4">
            {finalFaqs.map((f, idx) => (
              <FAQAccordionItem
                key={f.id || idx}
                faq={f}
                isOpen={openFaq === f.id}
                onToggle={() => setOpenFaq(openFaq === f.id ? null : f.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* HELP LINE */}
      {(phone || whatsapp) && (
        <section className="bg-slate-900/40 border-t border-slate-900 py-16 text-center overflow-hidden">
          <div className="mx-auto max-w-3xl px-4 space-y-6">
            <h2 className="text-3xl font-black text-white">Need Help Placing Your Order?</h2>
            {phone && (
              <p className="text-3xl font-black tracking-wider text-emerald-400 sm:text-4xl">
                {phone}
              </p>
            )}
            <div className="flex flex-col items-center gap-3.5 sm:flex-row sm:justify-center">
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp}`} onClick={() => trackMetaEvent("Contact", { method: "WhatsApp Help Line" })} target="_blank" rel="noopener noreferrer" className="lit-cta inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 px-10 py-5 text-lg font-black text-white hover:brightness-110 shadow-xl shadow-emerald-500/40 active:scale-[0.97] transition-all duration-200 animate-pulse sm:w-auto">
                  <MessageCircle className="h-6 w-6" /> Chat On WhatsApp
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} onClick={() => trackMetaEvent("Contact", { method: "Phone Help Line" })} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-8 py-4 font-black text-slate-300 hover:bg-slate-850 hover:text-white transition sm:w-auto">
                  <Phone className="h-5 w-5" /> Call {phone}
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 font-bold flex flex-col items-center gap-3">
        <p>© {new Date().getFullYear()} {settings?.store_name || "Store"} · All Rights Reserved</p>
        <Link href="/offers" onClick={() => trackMetaEvent("ViewContent", { content_name: "Offers Footer Link" })} className="text-emerald-400 hover:text-emerald-300 underline tracking-wider font-extrabold uppercase text-xs transition-colors">
          View Offers
        </Link>
      </footer>
    </main>
  );
}

/* ---------- Gallery Carousel component ---------- */
function GalleryCarousel({ slides }: { slides: { url: string; label: string }[] }) {
  const [i, setI] = useState(0);
  const total = slides.length;
  const go = (d: number) => setI((x) => (x + d + total) % total);
  const curr = slides[i];

  useEffect(() => {
    if (total <= 1) return;
    const id = window.setInterval(() => setI((x) => (x + 1) % total), 4000);
    return () => window.clearInterval(id);
  }, [total]);

  if (!total) return <div className="aspect-[4/3] w-full rounded-2xl bg-slate-900 flex items-center justify-center text-slate-500 font-bold border border-slate-850">No images uploaded</div>;

  return (
    <div className="rounded-3xl border border-slate-850 bg-slate-900/20 p-3.5 shadow-2xl backdrop-blur relative">
      <div className="relative overflow-hidden rounded-2xl">
        <span className="absolute left-3 top-3 z-10 rounded-lg bg-slate-950/70 border border-white/5 px-2.5 py-1 text-[10px] font-black tracking-widest text-slate-300">
          {i + 1} / {total}
        </span>

        <SlotImage src={curr.url} label={curr.label} dark className="aspect-[4/3] w-full rounded-2xl object-cover hover:scale-105 transition duration-500" />

        {total > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Prev" className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-xl bg-slate-950/60 p-2 text-white hover:bg-slate-900 border border-white/5 shadow-md active:scale-90 transition">
              <ChevronLeft className="h-5 w-5 text-emerald-400" />
            </button>
            <button onClick={() => go(1)} aria-label="Next" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl bg-slate-950/60 p-2 text-white hover:bg-slate-900 border border-white/5 shadow-md active:scale-90 transition">
              <ChevronRight className="h-5 w-5 text-emerald-400" />
            </button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {slides.map((_, n) => (
                <button key={n} onClick={() => setI(n)} aria-label={`Slide ${n + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-200 ${n === i ? "w-6 bg-emerald-400" : "w-1.5 bg-slate-500/50"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
          {slides.map((s, n) => (
            <button key={n} onClick={() => setI(n)}
              className={`aspect-square w-16 flex-none overflow-hidden rounded-xl border-2 transition ${n === i ? "border-emerald-400 scale-95" : "border-slate-800/80 hover:border-slate-700"}`}>
              <Image src={s.url} alt={s.label} width={64} height={64} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Slot Image w/ Fallback ---------- */
function SlotImage({ src, label, className = "", dark = false }: { src: string | null; label: string; className?: string; dark?: boolean }) {
  if (src) return <img src={src} alt={label} className={`${className} shadow-lg`} />;
  return (
    <div className={`${className} flex items-center justify-center text-center ${dark ? "bg-slate-900 text-emerald-400" : "bg-slate-900 text-slate-400"} border border-slate-800 px-6 text-base font-black tracking-widest shadow-lg uppercase`}>
      {label}
    </div>
  );
}

/* ---------- Reusable Call-To-Action Bar ---------- */
function CtaBar({ kicker, sub, label }: { kicker: string; sub: string; label: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 relative z-10">
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-emerald-500/15 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 sm:flex-row sm:justify-between sm:p-8 shadow-xl">
        <div className="space-y-1">
          <p className="text-sm font-black uppercase tracking-wider text-emerald-400">{kicker}</p>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">{sub}</p>
        </div>
        <a href="#order" onClick={() => trackMetaEvent("InitiateCheckout", { position: `CTA Bar: ${kicker}` })} className="lit-cta inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 px-10 py-5 text-base font-black text-white hover:brightness-110 shadow-xl shadow-emerald-500/40 active:scale-[0.97] transition-all duration-200 animate-pulse sm:w-auto">
          <CheckCircle2 className="h-5 w-5" />
          {label} →
        </a>
      </div>
    </section>
  );
}

/* ---------- Order checkout Form component ---------- */
function OrderForm({
  packages,
  whatsapp,
  email,
  phone,
  product,
  images,
}: {
  packages: Package[];
  whatsapp: string;
  email: string;
  phone: string;
  product: Product;
  images: GalleryImage[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", altPhone: "", address: "", state: "", pkg: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutInitiated, setCheckoutInitiated] = useState(false);

  const handleFormFocus = () => {
    if (!checkoutInitiated) {
      setCheckoutInitiated(true);
      trackMetaEvent("InitiateCheckout", {
        content_category: "Solar Light Form"
      });
    }
  };

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
    if (k === "pkg") {
      const p = packages.find((pkg) => pkg.id === val);
      if (p) {
        trackMetaEvent("AddToCart", {
          content_name: p.title,
          value: p.price,
          currency: "NGN",
          content_ids: [p.package_code ?? p.id],
          content_type: "product"
        });
      }
    }
  };

  const selectedPkg = useMemo(() => packages.find((p) => p.id === form.pkg) || null, [packages, form.pkg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.state || !form.pkg) {
      setError("Please fill all required fields marked *"); return;
    }
    if (form.name.trim().length < 2) { setError("Please enter your full name."); return; }
    if (!/^[0-9+\s-]{7,20}$/.test(form.phone.trim())) { setError("Please enter a valid phone number."); return; }
    if (!selectedPkg) { setError("Please select a package."); return; }
    if (selectedPkg.quantity < 2) { setError("Minimum order is 2 pieces."); return; }

    setSubmitting(true);

    // Call Supabase in background without waiting for it to complete
    (async () => {
      try {
        await db.from("orders").insert({
          customer_name: form.name.trim(),
          phone: form.phone.trim(),
          alt_phone: form.altPhone.trim() || null,
          address: form.address.trim(),
          state: form.state,
          package_id: selectedPkg.package_code,
          package_label: selectedPkg.bonus_text ? `${selectedPkg.title} + ${selectedPkg.bonus_text}` : selectedPkg.title,
          quantity: selectedPkg.quantity,
          total_amount: selectedPkg.price,
        });
      } catch (err) {
        // Ignore errors here - we just want the user to go to thank you
        console.log("Supabase order save failed (non-critical):", err);
      }
    })();

    trackMetaEvent("Lead", {
      content_name: selectedPkg.title,
      value: selectedPkg.price,
      currency: "NGN"
    });
    trackMetaEvent("Purchase", {
      content_name: selectedPkg.title,
      value: selectedPkg.price,
      currency: "NGN",
      content_type: "product"
    });

    // Collect all product images (hero, packaging, night, specs, gallery)
    const productImages: string[] = [];
    if (product.hero_image_url) productImages.push(product.hero_image_url);
    if (product.packaging_image_url) productImages.push(product.packaging_image_url);
    if (product.night_image_url) productImages.push(product.night_image_url);
    if (product.specs_image_url) productImages.push(product.specs_image_url);
    images.forEach(img => productImages.push(img.url));

    // Build search params for thank you page
    const params = new URLSearchParams();
    params.set("name", form.name.trim());
    params.set("phone", form.phone.trim());
    params.set("altPhone", form.altPhone.trim());
    params.set("address", form.address.trim());
    params.set("state", form.state);
    params.set("pkgTitle", selectedPkg.title);
    params.set("pkgPrice", selectedPkg.price.toString());
    params.set("pkgQty", selectedPkg.quantity.toString());
    params.set("productTitle", product.title);
    params.set("storeWhatsapp", whatsapp || phone || "");
    // Add up to 3 product images
    productImages.slice(0, 3).forEach((img, i) => {
      params.set(`img${i + 1}`, img);
    });

    // Redirect immediately to thank you page!
    router.push(`/thank-you?${params.toString()}`);
  };

  const inputCls = "w-full rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-4 text-base outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 text-slate-100 placeholder:text-slate-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-850 bg-slate-950/70 p-6 shadow-2xl sm:p-10 backdrop-blur relative">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-white sm:text-3xl">Place Your Order Below 👇</h2>
        <p className="text-sm text-slate-400 font-medium">Free shipping. Pay only when the delivery agent brings it to your door.</p>
      </div>

      <input required value={form.name} onChange={update("name")} onFocus={handleFormFocus} placeholder="Your Full Name *" className={inputCls} />
      <input required value={form.phone} onChange={update("phone")} onFocus={handleFormFocus} placeholder="Your Active Phone Number *" className={inputCls} />
      <input value={form.altPhone} onChange={update("altPhone")} onFocus={handleFormFocus} placeholder="Alternative Phone Number (Optional)" className={inputCls} />
      <textarea required value={form.address} onChange={update("address")} onFocus={handleFormFocus} placeholder="Full Delivery Address (Street name, area, house number) *" rows={3} className={inputCls} />

      <select required value={form.state} onChange={update("state")} onFocus={handleFormFocus} className={inputCls}>
        <option value="" disabled className="text-slate-700">Select Your Delivery State *</option>
        {STATES.map((s) => <option key={s} value={s} className="bg-slate-950 text-slate-200">{s}</option>)}
      </select>

      <div className="space-y-2.5">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          Select Your Bundle Deal * <span className="text-red-500">(MINIMUM 2 PIECES)</span>
        </p>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40">
          {packages.map((p) => (
            <label key={p.id} className={`flex cursor-pointer items-center justify-between border-b border-slate-900 px-4 py-4 hover:bg-slate-900/35 transition last:border-0 ${form.pkg === p.id ? "bg-emerald-500/5" : ""}`}>
              <span className="flex items-center gap-3">
                <input type="radio" name="pkg" value={p.id} checked={form.pkg === p.id} onChange={update("pkg")} className="h-4.5 w-4.5 accent-emerald-400" />
                <span className="font-bold text-sm text-slate-200">
                  {p.title}
                  {p.bonus_text && (
                    <span className="ml-2 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-400">
                      {p.bonus_text}
                    </span>
                  )}
                </span>
              </span>
              <span className="font-black text-emerald-400 text-sm">₦{p.price.toLocaleString()}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm font-bold text-red-400 border border-red-500/20 bg-red-500/5 p-3 rounded-xl text-center">{error}</p>}

      <button disabled={submitting} className="lit-cta w-full rounded-2xl py-6 text-lg font-black text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:brightness-110 active:scale-[0.97] transition-all duration-200 shadow-2xl shadow-emerald-500/40 disabled:opacity-60">
        <CheckCircle2 className="h-6 w-6" />
        {submitting ? "Submitting Order..." : "Confirm My Order Now"}
      </button>
    </form>
  );
}
