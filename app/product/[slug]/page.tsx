"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import ProductSalesFunnel from "@/components/ProductSalesFunnel";
import { db } from "@/lib/cms-types";
import {
  type Product,
  type Spec,
  type Feature,
  type Package,
  type SiteSettings,
  type Review,
  type FAQ,
  type GalleryImage
} from "@/lib/cms-types";
import { ArrowLeft } from "lucide-react";
import { trackMetaEvent } from "@/lib/meta-pixel";

export const dynamic = "force-dynamic";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
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

  // Track ViewContent when product is loaded
  useEffect(() => {
    if (data && data.product) {
      const unitPrice = data.product.price || (data.packages[0] ? Math.round(data.packages[0].price / data.packages[0].quantity) : 0);
      trackMetaEvent("ViewContent", {
        content_ids: [data.product.id],
        content_name: data.product.title,
        content_type: "product",
        value: unitPrice,
        currency: "NGN",
      });
    }
  }, [data]);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const { data: product, error: pErr } = await db
          .from("products")
          .select("*")
          .eq("slug", unwrappedParams.slug)
          .maybeSingle();

        if (pErr) {
          console.error("Product fetch error:", pErr);
          setError("Failed to load product.");
          setLoading(false);
          return;
        }

        if (!product) {
          setError("Product not found.");
          setLoading(false);
          return;
        }

        const productId = product.id;

        const [specsRes, featRes, pkgRes, setRes, revRes, faqRes, imgRes] =
          await Promise.all([
            db.from("product_specifications").select("*").eq("product_id", productId).order("sort_order"),
            db.from("product_features").select("*").eq("product_id", productId).order("sort_order"),
            db.from("packages").select("*").eq("product_id", productId).eq("active", true).order("sort_order"),
            db.from("site_settings").select("*").eq("id", 1).maybeSingle(),
            db.from("product_reviews").select("*").eq("product_id", productId).order("sort_order"),
            db.from("product_faqs").select("*").eq("product_id", productId).order("sort_order"),
            db.from("product_images").select("*").eq("product_id", productId).order("sort_order"),
          ]);

        setData({
          product: product as Product,
          specs: (specsRes.data as Spec[]) || [],
          features: (featRes.data as Feature[]) || [],
          packages: (pkgRes.data as Package[]) || [],
          settings: (setRes.data as SiteSettings) || {} as SiteSettings,
          reviews: (revRes.data as Review[]) || [],
          faqs: (faqRes.data as FAQ[]) || [],
          images: (imgRes.data as GalleryImage[]) || [],
        });
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [unwrappedParams.slug]);

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
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-black text-emerald-500 mb-4">Error</h2>
            <p className="text-slate-300 mb-6">{error}</p>
            <Link href="/" className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 font-bold hover:brightness-110 transition">
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">

      <ProductSalesFunnel {...data} />
    </div>
  );
}
