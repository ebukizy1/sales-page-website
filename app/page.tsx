"use client";

import { useEffect, useState } from "react";
import ProductSalesFunnel from "@/components/ProductSalesFunnel";
import type { Product, Spec, Feature, Package, SiteSettings, Review, FAQ, GalleryImage } from "@/lib/cms-types";
import { db } from "@/lib/cms-types";

export const dynamic = "force-dynamic";

export default function Home() {
  const [data, setData] = useState<{
    product: Product;
    specs: Spec[];
    features: Feature[];
    packages: Package[];
    settings: SiteSettings;
    reviews: Review[];
    faqs: FAQ[];
    images: GalleryImage[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: products, error: pErr } = await db
          .from("products")
          .select("*")
          .eq("active", true)
          .order("featured", { ascending: false })
          .limit(1);

        if (pErr) {
          console.error("Products fetch error:", pErr);
          setError("Failed to load product. Please refresh.");
          setLoading(false);
          return;
        }

        const product = products?.[0] ?? null;
        if (!product) {
          setError("No active product found.");
          setLoading(false);
          return;
        }

        const productId = product.id;

        const promises = [
          db.from("product_specifications").select("*").eq("product_id", productId).order("sort_order"),
          db.from("product_features").select("*").eq("product_id", productId).order("sort_order"),
          db.from("packages").select("*").eq("product_id", productId).eq("active", true).order("sort_order"),
          db.from("site_settings").select("*").eq("id", 1).maybeSingle(),
          db.from("product_reviews").select("*").eq("product_id", productId).order("sort_order"),
          db.from("product_faqs").select("*").eq("product_id", productId).order("sort_order"),
          db.from("product_images").select("*").eq("product_id", productId).order("sort_order"),
        ];

        const [specsRes, featRes, pkgRes, setRes, revRes, faqRes, imgRes] = await Promise.all(promises);

        const finalData = {
          product: product as Product,
          specs: (specsRes.data as Spec[]) || [],
          features: (featRes.data as Feature[]) || [],
          packages: (pkgRes.data as Package[]) || [],
          settings: (setRes.data as SiteSettings) || {} as SiteSettings,
          reviews: (revRes.data as Review[]) || [],
          faqs: (faqRes.data as FAQ[]) || [],
          images: (imgRes.data as GalleryImage[]) || [],
        };

        setData(finalData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Something went wrong. Please refresh.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-4"></div>
          <p className="text-xl font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-white">
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-emerald-500">Error</h2>
          <p className="text-slate-300">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 font-bold hover:brightness-110 transition"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return <ProductSalesFunnel {...data} />;
}
