"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/cms-types";
import { type Offer } from "@/lib/cms-types";
import { Tag, ArrowRight, Gift } from "lucide-react";
import { trackMetaEvent } from "@/lib/meta-pixel";

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Fetch offers
        const { data: offersData } = await db
          .from("offers")
          .select("*")
          .eq("active", true)
          .order("sort_order", { ascending: true });
        
        // Fetch all products to get their images
        const { data: productsData } = await db
          .from("products")
          .select("slug, hero_image_url");

        // Create a map of product slugs to hero images
        const productImgMap: Record<string, string> = {};
        productsData?.forEach((p: any) => {
          if (p.slug && p.hero_image_url) {
            productImgMap[p.slug] = p.hero_image_url;
          }
        });

        setOffers((offersData as Offer[]) || []);
        setProductImages(productImgMap);
      } catch (err) {
        console.error("Failed to load offers:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" onClick={() => trackMetaEvent("ClickLink", { destination: "Home from Offers" })} className="text-sm font-bold text-emerald-400">← Back to Home</Link>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">All Active Offers</p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
            <Gift className="h-3.5 w-3.5" /> Limited-Time Bundles
          </span>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">All Our Active Offers</h1>
          <p className="mt-3 text-slate-400">Pick the bundle that fits your home or street. Pay on delivery.</p>
        </div>

        {loading && <p className="mt-12 text-center text-slate-400">Loading offers…</p>}

        {!loading && offers.length === 0 && (
          <p className="mt-12 text-center text-slate-400">No offers available right now. Please check back soon.</p>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {offers.map((o) => {
            const savings = o.original_price && o.original_price > o.price ? o.original_price - o.price : 0;
            const cardImage = o.image_url || (o.product_slug ? productImages[o.product_slug] : undefined);
            return (
              <div key={o.id} className="group flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl">
                {o.badge && (
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-extrabold uppercase tracking-wider text-slate-950">
                    {o.badge}
                  </div>
                )}
                {cardImage && (
                  <div className="aspect-[16/9] w-full relative">
                    <Image src={cardImage} alt={o.title} fill className="object-cover" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Tag className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold">{o.title}</h2>
                      {o.description && <p className="mt-1 text-sm text-slate-400">{o.description}</p>}
                    </div>
                  </div>

                  <div className="mt-6 flex items-end gap-3">
                    <p className="text-4xl font-extrabold text-emerald-400">₦{o.price.toLocaleString()}</p>
                    {o.original_price && o.original_price > o.price && (
                      <p className="pb-1 text-sm text-slate-400 line-through">₦{o.original_price.toLocaleString()}</p>
                    )}
                  </div>
                  {savings > 0 && (
                    <p className="mt-1 text-xs font-bold text-red-400">You save ₦{savings.toLocaleString()}</p>
                  )}

                  {o.product_slug ? (
                    <Link
                      href={`/product/${o.product_slug}#order`}
                      onClick={() => trackMetaEvent("ViewContent", { content_name: o.title, value: o.price, currency: "NGN" })}
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5"
                    >
                      View Offer <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      href="/#order"
                      onClick={() => trackMetaEvent("InitiateCheckout", { content_name: o.title, value: o.price, currency: "NGN" })}
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5"
                    >
                      Order This Bundle <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
