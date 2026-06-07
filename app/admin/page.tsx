"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { db, type Product, type Spec, type Feature, type GalleryImage, type Package, type SiteSettings, type Offer, type Review, type FAQ } from "@/lib/cms-types";
import type { Session } from "@supabase/supabase-js";

type Tab = "orders" | "products" | "offers" | "settings";

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("orders");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  const claimAdmin = async () => {
    setMsg("");
    const { data, error } = await supabase.rpc("claim_first_admin");
    if (error) { setMsg(error.message); return; }
    if (data === true) { setIsAdmin(true); setMsg("You are now admin."); }
    else setMsg("An admin already exists.");
  };

  if (!session) return <AuthForm />;
  if (isAdmin === null) return <Centered>Checking permissions…</Centered>;
  if (!isAdmin) {
    return (
      <Centered>
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-extrabold">Not an admin</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Signed in as <strong>{session.user.email}</strong>. Claim admin if no admin exists yet.
          </p>
          <button onClick={claimAdmin} className="mt-5 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white">
            Claim Admin (First-Time Setup)
          </button>
          {msg && <p className="mt-3 text-sm text-red-500">{msg}</p>}
          <button onClick={() => supabase.auth.signOut()} className="mt-4 block w-full text-xs underline">Sign out</button>
        </div>
      </Centered>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Admin Dashboard</p>
            <h1 className="text-xl font-extrabold capitalize">{tab}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="underline">Home</Link>
            <Link href="/offers" className="underline">Offers</Link>
            <button onClick={() => supabase.auth.signOut()} className="rounded-lg border px-3 py-1.5 font-semibold">Sign out</button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {(["orders","products","offers","settings"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-bold capitalize ${tab === t ? "bg-slate-950 border border-b-0 border-slate-800 text-emerald-500" : "text-slate-400 hover:text-white"}`}>
                {t}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8">
        {tab === "orders" && <OrdersTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "offers" && <OffersTab />}
        {tab === "settings" && <SettingsTab />}
      </section>
    </main>
  );
}

/* =================== ORDERS =================== */
type Order = {
  id: string; customer_name: string; phone: string; alt_phone: string | null;
  address: string; state: string; package_label: string; quantity: number;
  total_amount: number; status: string; created_at: string;
};
const ORDER_STATUSES = ["pending","confirmed","processing","shipped","delivered","cancelled","new","called","dispatched"];

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(() => {
    setLoading(true);
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500)
      .then(({ data }) => { setOrders((data as Order[]) ?? []); setLoading(false); });
  }, []);
  useEffect(load, [load]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    setOrders((o) => o.map((x) => x.id === id ? { ...x, status } : x));
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{orders.length} total</p>
        <button onClick={load} className="text-xs underline">Refresh</button>
      </div>
      {loading && <p className="text-slate-400">Loading…</p>}
      {!loading && orders.length === 0 && <p className="text-slate-400">No orders yet.</p>}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/60 text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>{["Date","Customer","Phone","State","Address","Package","Qty","Total","Status"].map((h) => (
              <th key={h} className="px-3 py-3 font-bold">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-slate-800 align-top">
                <td className="px-3 py-3 text-xs text-slate-400">{new Date(o.created_at).toLocaleString()}</td>
                <td className="px-3 py-3 font-semibold">{o.customer_name}</td>
                <td className="px-3 py-3">
                  <a className="text-emerald-500 underline" href={`tel:${o.phone}`}>{o.phone}</a>
                  {o.alt_phone && <div className="text-xs text-slate-400">{o.alt_phone}</div>}
                </td>
                <td className="px-3 py-3">{o.state}</td>
                <td className="px-3 py-3 max-w-[220px] text-xs">{o.address}</td>
                <td className="px-3 py-3 text-xs">{o.package_label}</td>
                <td className="px-3 py-3">{o.quantity}</td>
                <td className="px-3 py-3 font-extrabold text-emerald-500">₦{o.total_amount.toLocaleString()}</td>
                <td className="px-3 py-3">
                  <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs">
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* =================== PRODUCTS =================== */
function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db.from("products").select("*").order("created_at", { ascending: false });
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  if (selected) return <ProductEditor product={selected} onClose={() => { setSelected(null); load(); }} />;

  const createNew = async () => {
    const slug = `product-${Date.now()}`;
    const { data, error } = await db.from("products").insert({ slug, title: "New Product", active: false }).select().single();
    if (error) { alert(error.message); return; }
    setSelected(data as Product);
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{products.length} products</p>
        <button onClick={createNew} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white">+ New Product</button>
      </div>
      {loading && <p className="text-slate-400">Loading…</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <button key={p.id} onClick={() => setSelected(p)} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            {p.hero_image_url ? (
              <img src={p.hero_image_url} alt={p.title} className="aspect-video w-full object-cover" />
            ) : (
              <div className="aspect-video w-full bg-slate-800" />
            )}
            <div className="p-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">{p.title}</h3>
                {p.featured && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-500">Featured</span>}
                {!p.active && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-500">Inactive</span>}
              </div>
              <p className="mt-1 text-xs text-slate-400">/{p.slug}</p>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function ProductEditor({ product, onClose }: { product: Product; onClose: () => void }) {
  const [p, setP] = useState<Product>(product);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    const [s, f, g, k, r, aq] = await Promise.all([
      db.from("product_specifications").select("*").eq("product_id", p.id).order("sort_order"),
      db.from("product_features").select("*").eq("product_id", p.id).order("sort_order"),
      db.from("product_images").select("*").eq("product_id", p.id).order("sort_order"),
      db.from("packages").select("*").eq("product_id", p.id).order("sort_order"),
      db.from("product_reviews").select("*").eq("product_id", p.id).order("sort_order"),
      db.from("product_faqs").select("*").eq("product_id", p.id).order("sort_order"),
    ]);
    setSpecs(s.data ?? []);
    setFeatures(f.data ?? []);
    setGallery(g.data ?? []);
    setPackages(k.data ?? []);
    setReviews(r.data ?? []);
    setFaqs(aq.data ?? []);
  }, [p.id]);
  useEffect(() => { loadAll(); }, [loadAll]);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));

  const save = async () => {
    setSaving(true);
    const unknownColumnRe = /Could not find the '([^']+)' column of 'products' in the schema cache/;

    const updateProductWithRetry = async (patch: Record<string, unknown>) => {
      const skipped: string[] = [];
      let nextPatch: Record<string, unknown> = { ...patch };
      let lastError: any = null;

      for (let attempt = 0; attempt < 30; attempt++) {
        const { error } = await db.from("products").update(nextPatch).eq("id", p.id);
        if (!error) return { skipped, error: null };

        lastError = error;
        const match = unknownColumnRe.exec(String(error.message ?? ""));
        if (!match) return { skipped, error };

        const col = match[1];
        if (!(col in nextPatch)) return { skipped, error };
        delete nextPatch[col];
        skipped.push(col);

        if (Object.keys(nextPatch).length === 0) return { skipped, error };
      }

      return { skipped, error: lastError };
    };

    const basicPatch = {
      slug: p.slug,
      title: p.title,
      short_description: p.short_description,
      long_description: p.long_description,
      hero_image_url: p.hero_image_url,
      video_url: p.video_url,
      warranty_text: p.warranty_text,
      delivery_text: p.delivery_text,
      active: p.active,
      featured: p.featured,
    };

    const basicRes = await updateProductWithRetry(basicPatch);
    if (basicRes.error) {
      setSaving(false);
      alert(basicRes.error.message);
      return;
    }

    const dynamicPatch = {
      tagline: p.tagline,
      hero_headline: p.hero_headline,
      hero_subheadline: p.hero_subheadline,
      hero_description: p.hero_description,
      hero_cta_text: p.hero_cta_text,
      hero_cta_link: p.hero_cta_link,
      price: p.price ? Number(p.price) : null,
      discount_price: p.discount_price ? Number(p.discount_price) : null,
      stock_status: p.stock_status,
      features_section_title: p.features_section_title,
      features_section_subtitle: p.features_section_subtitle,
      bills_section_title: p.bills_section_title,
      bills_section_description: p.bills_section_description,
      bills_section_list: p.bills_section_list,
      security_section_title: p.security_section_title,
      security_section_description: p.security_section_description,
      security_media_type: p.security_media_type,
      specs_section_title: p.specs_section_title,
      specs_section_subtitle: p.specs_section_subtitle,
      packaging_image_url: p.packaging_image_url,
      night_image_url: p.night_image_url,
      specs_image_url: p.specs_image_url,
      final_cta_headline: p.final_cta_headline,
      final_cta_subheadline: p.final_cta_subheadline,
      final_cta_button_text: p.final_cta_button_text,
      final_cta_button_link: p.final_cta_button_link,
      final_cta_bg_image_url: p.final_cta_bg_image_url,
    };

    const dynamicRes = await updateProductWithRetry(dynamicPatch);
    setSaving(false);

    if (dynamicRes.error) {
      const skipped = [...basicRes.skipped, ...dynamicRes.skipped];
      const skippedText = skipped.length ? ` Skipped: ${skipped.join(", ")}.` : "";
      alert(`Saved basic product fields, but some sales-page section fields could not be saved: ${dynamicRes.error.message}.${skippedText}`);
      return;
    }

    const skipped = [...basicRes.skipped, ...dynamicRes.skipped];
    if (skipped.length) {
      alert(`Saved. Some fields were skipped because your database is missing columns: ${skipped.join(", ")}`);
      return;
    }

    const offerUnknownColumnRe = /Could not find the '([^']+)' column of 'offers' in the schema cache/;
    const offerPayload = {
      title: p.title,
      description: p.short_description,
      price: packages?.[0]?.price ?? (p.price ? Number(p.price) : 0),
      original_price: p.discount_price ? Number(p.discount_price) : null,
      badge: "Offer",
      image_url: p.hero_image_url,
      product_slug: p.slug,
      active: true,
    };

    const { data: existingOffer, error: findOfferError } = await db
      .from("offers")
      .select("id")
      .eq("product_slug", p.slug)
      .maybeSingle();

    if (findOfferError) {
      const m = offerUnknownColumnRe.exec(String(findOfferError.message ?? ""));
      if (!m) alert(`Saved product, but could not sync offer card: ${findOfferError.message}`);
    } else {
      if (existingOffer?.id) {
        const { error: offerUpdateError } = await db.from("offers").update(offerPayload).eq("id", existingOffer.id);
        if (offerUpdateError) {
          const m = offerUnknownColumnRe.exec(String(offerUpdateError.message ?? ""));
          if (!m) alert(`Saved product, but could not sync offer card: ${offerUpdateError.message}`);
        }
      } else {
        const { error: offerInsertError } = await db.from("offers").insert({ ...offerPayload, sort_order: 9999 });
        if (offerInsertError) {
          const m = offerUnknownColumnRe.exec(String(offerInsertError.message ?? ""));
          if (!m) alert(`Saved product, but could not create offer card: ${offerInsertError.message}`);
        }
      }
    }

    alert("Saved");
  };

  const remove = async () => {
    if (!confirm("Delete this product and all its specs/features/images/packages?")) return;
    await db.from("products").delete().eq("id", p.id);
    onClose();
  };

  const uploadTo = async (
    slot: "hero_image_url" | "packaging_image_url" | "night_image_url" | "specs_image_url" | "final_cta_bg_image_url",
    file: File,
  ) => {
    const path = `${p.id}/${slot}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("products").upload(path, file, { upsert: true });
    if (error) { alert(error.message); return; }
    const { data } = supabase.storage.from("products").getPublicUrl(path);
    set(slot, data.publicUrl);
  };

  const uploadSecurityVideo = async (file: File) => {
    const path = `${p.id}/security-video-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("products").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { alert(error.message); return; }
    const { data } = supabase.storage.from("products").getPublicUrl(path);
    set("video_url", data.publicUrl);
    set("security_media_type", "video");
  };

  const imageSlots: {
    key: "hero_image_url" | "specs_image_url" | "packaging_image_url" | "night_image_url" | "final_cta_bg_image_url";
    label: string; hint: string;
  }[] = [
    { key: "hero_image_url",      label: "1. Hero / Product Image",      hint: "Main product shot — shown first in the hero gallery." },
    { key: "specs_image_url",     label: "2. Specifications Image",      hint: "Spec/diagram shot — shown beside the spec table." },
    { key: "packaging_image_url", label: "3. Packaging Image",           hint: "Box / unboxing shot — shown in the 'Zero Bills' section." },
    { key: "night_image_url",     label: "4. Installed-At-Night Image / Media", hint: "Night / installed shot — shown in the 'Real Light' section." },
    { key: "final_cta_bg_image_url", label: "5. Final CTA Background Image", hint: "Background image for the final call-to-action section." },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={onClose} className="text-sm underline">← Back to products</button>
        <div className="flex gap-2">
          <button onClick={remove} className="rounded-xl border border-red-500 px-4 py-2 text-sm font-bold text-red-500">Delete</button>
          <button onClick={save} disabled={saving} className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving…" : "Save Product"}</button>
        </div>
      </div>

      <Section title="Basic Info">
        <Field label="Title"><input className={inputCls} value={p.title} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="Slug"><input className={inputCls} value={p.slug} onChange={(e) => set("slug", e.target.value)} /></Field>
        <Field label="Short Description"><input className={inputCls} value={p.short_description ?? ""} onChange={(e) => set("short_description", e.target.value)} /></Field>
        <Field label="Long Description"><textarea rows={4} className={inputCls} value={p.long_description ?? ""} onChange={(e) => set("long_description", e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Warranty Text"><input className={inputCls} value={p.warranty_text ?? ""} onChange={(e) => set("warranty_text", e.target.value)} /></Field>
          <Field label="Delivery Text"><input className={inputCls} value={p.delivery_text ?? ""} onChange={(e) => set("delivery_text", e.target.value)} /></Field>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.active} onChange={(e) => set("active", e.target.checked)} /> Active</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured</label>
        </div>
      </Section>

      <Section title="SECTION 1: HERO SECTION COPY & PRICING">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product Tagline"><input className={inputCls} value={p.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} placeholder="e.g. Pay On Delivery Nationwide" /></Field>
          <Field label="Hero Headline"><input className={inputCls} value={p.hero_headline ?? ""} onChange={(e) => set("hero_headline", e.target.value)} placeholder="e.g. Light Your Whole Compound — Without NEPA." /></Field>
        </div>
        <Field label="Hero Subheadline"><input className={inputCls} value={p.hero_subheadline ?? ""} onChange={(e) => set("hero_subheadline", e.target.value)} placeholder="e.g. Die-cast aluminium · 25,000mAh · 5-Year Warranty" /></Field>
        <Field label="Hero Description (Bullet points, one per line)"><textarea rows={4} className={inputCls} value={p.hero_description ?? ""} onChange={(e) => set("hero_description", e.target.value)} placeholder="Die-cast aluminium body&#10;25,000mAh lithium battery" /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Regular Price (Discount Price)"><input type="number" className={inputCls} value={p.discount_price ?? ""} onChange={(e) => set("discount_price", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 50000" /></Field>
          <Field label="Selling Price (Price)"><input type="number" className={inputCls} value={p.price ?? ""} onChange={(e) => set("price", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 35000" /></Field>
          <Field label="Stock Status"><input className={inputCls} value={p.stock_status ?? ""} onChange={(e) => set("stock_status", e.target.value)} placeholder="e.g. Only 14 units left at promo price" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CTA Button Text"><input className={inputCls} value={p.hero_cta_text ?? ""} onChange={(e) => set("hero_cta_text", e.target.value)} placeholder="e.g. Order Now" /></Field>
          <Field label="CTA Button Link"><input className={inputCls} value={p.hero_cta_link ?? ""} onChange={(e) => set("hero_cta_link", e.target.value)} placeholder="e.g. #order" /></Field>
        </div>
      </Section>

      <Section title="SECTION 2: WHY THIS MODEL SETTINGS">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Section Title"><input className={inputCls} value={p.features_section_title ?? ""} onChange={(e) => set("features_section_title", e.target.value)} placeholder="e.g. Why This Model Wins" /></Field>
          <Field label="Section Subtitle"><input className={inputCls} value={p.features_section_subtitle ?? ""} onChange={(e) => set("features_section_subtitle", e.target.value)} placeholder="e.g. Built to fix every complaint..." /></Field>
        </div>
      </Section>

      <Section title="SECTION 3: ZERO BILLS SECTION SETTINGS">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Section Title"><input className={inputCls} value={p.bills_section_title ?? ""} onChange={(e) => set("bills_section_title", e.target.value)} placeholder="e.g. One Light. Zero Bills. Zero Stress." /></Field>
          <Field label="Section Description"><textarea rows={3} className={inputCls} value={p.bills_section_description ?? ""} onChange={(e) => set("bills_section_description", e.target.value)} placeholder="Section copy..." /></Field>
        </div>
        <Field label="Section List Items (one per line)"><textarea rows={4} className={inputCls} value={p.bills_section_list ?? ""} onChange={(e) => set("bills_section_list", e.target.value)} placeholder="Compounds, gates, streets, farms, car parks, churches&#10;Waterproof (IP67) — works through the heaviest rainy season" /></Field>
      </Section>

      <Section title="SECTION 4: REAL SECURITY SECTION SETTINGS">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Section Title"><input className={inputCls} value={p.security_section_title ?? ""} onChange={(e) => set("security_section_title", e.target.value)} placeholder="e.g. Real Light. Real Security." /></Field>
          <Field label="Media Type"><select value={p.security_media_type ?? "image"} onChange={(e) => set("security_media_type", e.target.value)} className={inputCls}><option value="image">Show Image</option><option value="video">Show Video</option></select></Field>
          <Field label="Video URL (Youtube Embed or MP4)"><input className={inputCls} value={p.video_url ?? ""} onChange={(e) => set("video_url", e.target.value)} placeholder="e.g. https://www.youtube.com/embed/..." /></Field>
        </div>
        <Field label="Upload Video (MP4)">
          <input type="file" accept="video/mp4,video/*" onChange={(e) => e.target.files?.[0] && uploadSecurityVideo(e.target.files[0])} className="block w-full text-xs" />
        </Field>
        <Field label="Section Description"><textarea rows={3} className={inputCls} value={p.security_section_description ?? ""} onChange={(e) => set("security_section_description", e.target.value)} placeholder="Section copy..." /></Field>
      </Section>

      <Section title="SECTION 5: SPECIFICATIONS SECTION SETTINGS">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Section Title"><input className={inputCls} value={p.specs_section_title ?? ""} onChange={(e) => set("specs_section_title", e.target.value)} placeholder="e.g. Full Specifications" /></Field>
          <Field label="Section Subtitle"><input className={inputCls} value={p.specs_section_subtitle ?? ""} onChange={(e) => set("specs_section_subtitle", e.target.value)} placeholder="e.g. The right parts. No shortcuts." /></Field>
        </div>
      </Section>

      <Section title="SECTION 9: FINAL CTA SETTINGS">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CTA Headline"><input className={inputCls} value={p.final_cta_headline ?? ""} onChange={(e) => set("final_cta_headline", e.target.value)} placeholder="e.g. GET YOURS TODAY — LIMITED STOCK" /></Field>
          <Field label="CTA Subheadline"><input className={inputCls} value={p.final_cta_subheadline ?? ""} onChange={(e) => set("final_cta_subheadline", e.target.value)} placeholder="e.g. Over 380 units shipped..." /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Button Text"><input className={inputCls} value={p.final_cta_button_text ?? ""} onChange={(e) => set("final_cta_button_text", e.target.value)} placeholder="e.g. Claim This Offer" /></Field>
          <Field label="Button Link"><input className={inputCls} value={p.final_cta_button_link ?? ""} onChange={(e) => set("final_cta_button_link", e.target.value)} placeholder="e.g. #order" /></Field>
        </div>
      </Section>

      <Section title="Sales Page Section Images">
        <p className="text-xs text-slate-400">
          One image per section, in the order they appear on the sales page. After uploading, click <strong>Save Product</strong> at the top.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {imageSlots.map(({ key, label, hint }) => {
            const url = p[key] as string | null;
            return (
              <div key={key} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-sm font-bold">{label}</p>
                <p className="mb-2 text-xs text-slate-400">{hint}</p>
                {url ? (
                  <img src={url} alt={label} className="mb-2 aspect-video w-full rounded-lg object-cover" />
                ) : (
                  <div className="mb-2 flex aspect-video w-full items-center justify-center rounded-lg bg-slate-800 text-xs text-slate-400">No image</div>
                )}
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadTo(key, e.target.files[0])} className="block w-full text-xs" />
                <input
                  className={`${inputCls} mt-2`}
                  placeholder="…or paste image URL"
                  value={url ?? ""}
                  onChange={(e) => set(key, e.target.value)}
                />
                {url && (
                  <button type="button" onClick={() => set(key, null)} className="mt-2 text-xs text-red-500 underline">Remove</button>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <SpecsSection productId={p.id} items={specs} reload={loadAll} />
      <FeaturesSection productId={p.id} items={features} reload={loadAll} />
      <GallerySection productId={p.id} items={gallery} reload={loadAll} />
      <PackagesSection productId={p.id} items={packages} reload={loadAll} />
      <ReviewsSection productId={p.id} items={reviews} reload={loadAll} />
      <FaqsSection productId={p.id} items={faqs} reload={loadAll} />
    </div>
  );
}

function SpecsSection({ productId, items, reload }: { productId: string; items: Spec[]; reload: () => void }) {
  const add = async () => { await db.from("product_specifications").insert({ product_id: productId, label: "New", value: "", sort_order: items.length }); reload(); };
  const upd = async (id: string, patch: Partial<Spec>) => { await db.from("product_specifications").update(patch).eq("id", id); reload(); };
  const del = async (id: string) => { await db.from("product_specifications").delete().eq("id", id); reload(); };
  return (
    <Section title="Specifications" action={<button onClick={add} className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white">+ Add</button>}>
      <div className="space-y-2">
        {items.map((s) => (
          <div key={s.id} className="grid grid-cols-[1fr_2fr_auto_auto] gap-2">
            <input defaultValue={s.label} onBlur={(e) => e.target.value !== s.label && upd(s.id, { label: e.target.value })} className={inputCls} placeholder="Label" />
            <input defaultValue={s.value} onBlur={(e) => e.target.value !== s.value && upd(s.id, { value: e.target.value })} className={inputCls} placeholder="Value" />
            <input type="number" defaultValue={s.sort_order} onBlur={(e) => upd(s.id, { sort_order: Number(e.target.value) })} className={`${inputCls} w-20`} />
            <button onClick={() => del(s.id)} className="rounded-lg border border-red-500 px-3 text-xs font-bold text-red-500">Del</button>
          </div>
        ))}
      </div>
    </Section>
  );
}

function FeaturesSection({ productId, items, reload }: { productId: string; items: Feature[]; reload: () => void }) {
  const add = async () => { await db.from("product_features").insert({ product_id: productId, title: "New feature", sort_order: items.length }); reload(); };
  const upd = async (id: string, patch: Partial<Feature>) => { await db.from("product_features").update(patch).eq("id", id); reload(); };
  const del = async (id: string) => { await db.from("product_features").delete().eq("id", id); reload(); };
  return (
    <Section title="Features" action={<button onClick={add} className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white">+ Add</button>}>
      <div className="space-y-3">
        {items.map((f) => (
          <div key={f.id} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-800 p-3 sm:grid-cols-[1fr_2fr_auto_auto_auto]">
            <input defaultValue={f.title} onBlur={(e) => upd(f.id, { title: e.target.value })} className={inputCls} placeholder="Title" />
            <input defaultValue={f.description ?? ""} onBlur={(e) => upd(f.id, { description: e.target.value })} className={inputCls} placeholder="Description" />
            <input defaultValue={f.icon ?? ""} onBlur={(e) => upd(f.id, { icon: e.target.value })} className={`${inputCls} w-32`} placeholder="Icon (e.g. Sun)" />
            <input type="number" defaultValue={f.sort_order} onBlur={(e) => upd(f.id, { sort_order: Number(e.target.value) })} className={`${inputCls} w-20`} />
            <button onClick={() => del(f.id)} className="rounded-lg border border-red-500 px-3 text-xs font-bold text-red-500">Del</button>
          </div>
        ))}
        <p className="text-xs text-slate-400">Icon names: Sun, Award, BatteryFull, ShieldCheck, Zap, Droplet, Wrench, Leaf, Truck, Lock, Star, CheckCircle2</p>
      </div>
    </Section>
  );
}

function GallerySection({ productId, items, reload }: { productId: string; items: GalleryImage[]; reload: () => void }) {
  const upload = async (file: File, type: string) => {
    const path = `${productId}/gallery-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("products").upload(path, file);
    if (error) { alert(error.message); return; }
    const { data } = supabase.storage.from("products").getPublicUrl(path);
    await db.from("product_images").insert({ product_id: productId, url: data.publicUrl, sort_order: items.length, image_type: type });
    reload();
  };
  const del = async (id: string) => { await db.from("product_images").delete().eq("id", id); reload(); };
  const upd = async (id: string, patch: Partial<GalleryImage>) => { await db.from("product_images").update(patch).eq("id", id); reload(); };
  return (
    <Section title="Gallery" action={
      <div className="flex gap-2">
        <label className="cursor-pointer rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
          + Gallery Image<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "gallery")} />
        </label>
        <label className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
          + Before/After<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "before_after")} />
        </label>
        <label className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white">
          + Installation<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "installation")} />
        </label>
      </div>
    }>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((g) => (
          <div key={g.id} className="overflow-hidden rounded-xl border border-slate-800">
            <img src={g.url} alt={g.alt ?? ""} className="aspect-square w-full object-cover" />
            <div className="space-y-2 p-2 bg-slate-950">
              <input defaultValue={g.alt ?? ""} onBlur={(e) => upd(g.id, { alt: e.target.value })} className={inputCls} placeholder="Alt text" />
              <select value={g.image_type ?? "gallery"} onChange={(e) => upd(g.id, { image_type: e.target.value })} className={inputCls}>
                <option value="gallery">Gallery Image</option>
                <option value="before_after">Before / After Image</option>
                <option value="installation">Installation Image</option>
              </select>
              <div className="flex gap-2">
                <input type="number" defaultValue={g.sort_order} onBlur={(e) => upd(g.id, { sort_order: Number(e.target.value) })} className={`${inputCls} w-20`} />
                <button onClick={() => del(g.id)} className="flex-1 rounded-lg border border-red-500 px-3 py-1 text-xs font-bold text-red-500">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PackagesSection({ productId, items, reload }: { productId: string; items: Package[]; reload: () => void }) {
  const add = async () => { await db.from("packages").insert({ product_id: productId, package_code: `pkg${Date.now()}`, title: "New Package", quantity: 1, price: 0, sort_order: items.length, active: true }); reload(); };
  const upd = async (id: string, patch: Partial<Package>) => { await db.from("packages").update(patch).eq("id", id); reload(); };
  const del = async (id: string) => { await db.from("packages").delete().eq("id", id); reload(); };
  return (
    <Section title="Packages" action={<button onClick={add} className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white">+ Add</button>}>
      <div className="space-y-3">
        {items.map((k) => (
          <div key={k.id} className="grid gap-2 rounded-xl border border-slate-800 p-3 sm:grid-cols-[1fr_1fr_80px_120px_1fr_70px_auto_auto]">
            <input defaultValue={k.package_code} onBlur={(e) => upd(k.id, { package_code: e.target.value })} className={inputCls} placeholder="Code" />
            <input defaultValue={k.title} onBlur={(e) => upd(k.id, { title: e.target.value })} className={inputCls} placeholder="Title" />
            <input type="number" defaultValue={k.quantity} onBlur={(e) => upd(k.id, { quantity: Number(e.target.value) })} className={inputCls} placeholder="Qty" />
            <input type="number" defaultValue={k.price} onBlur={(e) => upd(k.id, { price: Number(e.target.value) })} className={inputCls} placeholder="Price ₦" />
            <input defaultValue={k.bonus_text ?? ""} onBlur={(e) => upd(k.id, { bonus_text: e.target.value })} className={inputCls} placeholder="Bonus" />
            <input type="number" defaultValue={k.sort_order} onBlur={(e) => upd(k.id, { sort_order: Number(e.target.value) })} className={inputCls} placeholder="Order" />
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" defaultChecked={k.active} onChange={(e) => upd(k.id, { active: e.target.checked })} /> Active</label>
            <button onClick={() => del(k.id)} className="rounded-lg border border-red-500 px-3 text-xs font-bold text-red-500">Del</button>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ReviewsSection({ productId, items, reload }: { productId: string; items: Review[]; reload: () => void }) {
  const add = async () => {
    await db.from("product_reviews").insert({
      product_id: productId,
      customer_name: "Customer Name",
      customer_location: "Lagos",
      rating: 5,
      review_text: "Great product...",
      sort_order: items.length,
    });
    reload();
  };
  const upd = async (id: string, patch: Partial<Review>) => {
    await db.from("product_reviews").update(patch).eq("id", id);
    reload();
  };
  const del = async (id: string) => {
    await db.from("product_reviews").delete().eq("id", id);
    reload();
  };
  const uploadPhoto = async (id: string, file: File) => {
    const path = `${productId}/review-${id}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("products").upload(path, file, { upsert: true });
    if (error) { alert(error.message); return; }
    const { data } = supabase.storage.from("products").getPublicUrl(path);
    await upd(id, { customer_photo_url: data.publicUrl });
  };
  return (
    <Section title="Reviews" action={<button onClick={add} className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white">+ Add</button>}>
      <div className="space-y-4">
        {items.map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-800 p-4 bg-slate-950 space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <Field label="Name"><input defaultValue={r.customer_name} onBlur={(e) => upd(r.id, { customer_name: e.target.value })} className={inputCls} /></Field>
              <Field label="Location"><input defaultValue={r.customer_location ?? ""} onBlur={(e) => upd(r.id, { customer_location: e.target.value })} className={inputCls} /></Field>
              <Field label="Rating"><input type="number" min={1} max={5} defaultValue={r.rating} onBlur={(e) => upd(r.id, { rating: Number(e.target.value) })} className={inputCls} /></Field>
            </div>
            <Field label="Review Text"><textarea defaultValue={r.review_text} onBlur={(e) => upd(r.id, { review_text: e.target.value })} className={inputCls} rows={2} /></Field>
            <div className="flex flex-wrap items-center gap-3">
              {r.customer_photo_url && <img src={r.customer_photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />}
              <label className="cursor-pointer rounded-lg border border-slate-800 px-3 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700">
                Upload Photo<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(r.id, e.target.files[0])} />
              </label>
              <input defaultValue={r.customer_photo_url ?? ""} onBlur={(e) => upd(r.id, { customer_photo_url: e.target.value })} className={`${inputCls} flex-1`} placeholder="or paste image URL" />
              <input type="number" defaultValue={r.sort_order} onBlur={(e) => upd(r.id, { sort_order: Number(e.target.value) })} className={`${inputCls} w-20`} placeholder="Order" />
              <button onClick={() => del(r.id)} className="rounded-lg border border-red-500 px-3 py-1 text-xs font-bold text-red-500">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function FaqsSection({ productId, items, reload }: { productId: string; items: FAQ[]; reload: () => void }) {
  const add = async () => { await db.from("product_faqs").insert({ product_id: productId, question: "Question?", answer: "Answer...", sort_order: items.length }); reload(); };
  const upd = async (id: string, patch: Partial<FAQ>) => { await db.from("product_faqs").update(patch).eq("id", id); reload(); };
  const del = async (id: string) => { await db.from("product_faqs").delete().eq("id", id); reload(); };
  return (
    <Section title="FAQs" action={<button onClick={add} className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white">+ Add</button>}>
      <div className="space-y-4">
        {items.map((f) => (
          <div key={f.id} className="rounded-xl border border-slate-800 p-4 bg-slate-950 space-y-3">
            <Field label="Question"><input defaultValue={f.question} onBlur={(e) => upd(f.id, { question: e.target.value })} className={inputCls} /></Field>
            <Field label="Answer"><textarea defaultValue={f.answer} onBlur={(e) => upd(f.id, { answer: e.target.value })} className={inputCls} rows={2} /></Field>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs text-slate-400">Order:</span>
              <input type="number" defaultValue={f.sort_order} onBlur={(e) => upd(f.id, { sort_order: Number(e.target.value) })} className={`${inputCls} w-20`} />
              <button onClick={() => del(f.id)} className="rounded-lg border border-red-500 px-3 py-1 text-xs font-bold text-red-500">Del</button>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* =================== OFFERS =================== */
function OffersTab() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Array<{ slug: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db.from("offers").select("*").order("sort_order");
    setOffers((data as Offer[]) ?? []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    (async () => {
      const { data } = await db.from("products").select("slug,title").order("created_at", { ascending: false }).limit(500);
      setProducts((data as Array<{ slug: string; title: string }>) ?? []);
    })();
  }, []);

  const add = async () => {
    await db.from("offers").insert({ title: "New Offer", price: 0, sort_order: offers.length, active: true });
    load();
  };
  const upd = async (id: string, patch: Partial<Offer>) => {
    const { error } = await db.from("offers").update(patch).eq("id", id);
    if (error) alert(error.message);
    load();
  };
  const del = async (id: string) => { if (confirm("Delete offer?")) { await db.from("offers").delete().eq("id", id); load(); } };

  const uploadImage = async (id: string, file: File) => {
    const path = `${id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("offers").upload(path, file, { upsert: true });
    if (error) { alert(error.message); return; }
    const { data } = supabase.storage.from("offers").getPublicUrl(path);
    upd(id, { image_url: data.publicUrl });
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{offers.length} offers</p>
        <button onClick={add} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white">+ New Offer</button>
      </div>
      {loading && <p>Loading…</p>}
      <div className="space-y-4">
        {offers.map((o) => (
          <div key={o.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title"><input defaultValue={o.title} onBlur={(e) => upd(o.id, { title: e.target.value })} className={inputCls} /></Field>
              <Field label="Badge"><input defaultValue={o.badge ?? ""} onBlur={(e) => upd(o.id, { badge: e.target.value })} className={inputCls} /></Field>
              <Field label="Description"><input defaultValue={o.description ?? ""} onBlur={(e) => upd(o.id, { description: e.target.value })} className={inputCls} /></Field>
              <Field label="Price ₦"><input type="number" defaultValue={o.price} onBlur={(e) => upd(o.id, { price: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Original Price ₦"><input type="number" defaultValue={o.original_price ?? 0} onBlur={(e) => upd(o.id, { original_price: Number(e.target.value) || null })} className={inputCls} /></Field>
              <Field label="Sort Order"><input type="number" defaultValue={o.sort_order} onBlur={(e) => upd(o.id, { sort_order: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Sales Page Product">
                <select
                  defaultValue={o.product_slug ?? ""}
                  onChange={(e) => upd(o.id, { product_slug: e.target.value || null })}
                  className={inputCls}
                >
                  <option value="">(No sales page)</option>
                  {products.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.title}</option>
                  ))}
                </select>
              </Field>
              <Field label="Offer Image">
                {o.image_url && (
                  <img src={o.image_url} alt={o.title} className="mb-2 max-w-xs rounded-lg object-cover" />
                )}
                <div className="flex gap-2">
                  <label className="cursor-pointer rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                    Upload Image<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(o.id, e.target.files[0])} />
                  </label>
                  <input defaultValue={o.image_url ?? ""} onBlur={(e) => upd(o.id, { image_url: e.target.value })} className={`${inputCls} flex-1`} placeholder="or paste image URL" />
                </div>
              </Field>
              <div className="flex items-center gap-2 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={o.active} onChange={(e) => upd(o.id, { active: e.target.checked })} /> Active</label>
                <button onClick={() => del(o.id)} className="rounded-lg border border-red-500 px-3 py-1 text-xs font-bold text-red-500 ml-auto">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* =================== SETTINGS =================== */
function SettingsTab() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db.from("site_settings").select("*").eq("id", 1).maybeSingle();
    setSettings(data as SiteSettings | null);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <Section title="Settings">
      {loading && <p className="text-slate-400">Loading…</p>}
      {!loading && !settings && <p className="text-slate-400">No settings found.</p>}
      {settings && <div className="space-y-3">Settings loaded.</div>}
    </Section>
  );
}

/* =================== HELPERS =================== */
const inputCls = "w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none ring-1 ring-transparent focus:ring-emerald-500 text-slate-100 placeholder:text-slate-500";

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center p-4">{children}</div>;
}

function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert("Check your email for a confirmation link!");
    }
    setLoading(false);
  };

  return (
    <Centered>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h1 className="text-xl font-extrabold">Admin Access</h1>
        <Field label="Email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
        </Field>
        <button disabled={loading} type="submit" className="w-full rounded-xl bg-emerald-500 px-4 py-2 font-bold text-white disabled:opacity-60">
          {loading ? "Loading…" : (mode === "signin" ? "Sign In" : "Sign Up")}
        </button>
        <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="w-full text-xs underline text-slate-400">
          {mode === "signin" ? "Need an account? Sign Up" : "Have an account? Sign In"}
        </button>
      </form>
    </Centered>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        {action}
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-slate-400">{label}</label>
      {children}
    </div>
  );
}
