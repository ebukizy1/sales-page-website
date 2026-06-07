"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, MessageCircle, Gift, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/cms-types";
import { type Offer } from "@/lib/cms-types";
import { trackMetaEvent } from "@/lib/meta-pixel";

export const dynamic = "force-dynamic";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);

  const name = searchParams.get("name") || "Customer";
  const phone = searchParams.get("phone") || "";
  const altPhone = searchParams.get("altPhone") || "";
  const address = searchParams.get("address") || "";
  const state = searchParams.get("state") || "";
  const pkgTitle = searchParams.get("pkgTitle") || "";
  const pkgPrice = searchParams.get("pkgPrice") || "0";
  const pkgQty = searchParams.get("pkgQty") || "0";
  const productTitle = searchParams.get("productTitle") || "";
  const storeWhatsapp = searchParams.get("storeWhatsapp") || "";
  const img1 = searchParams.get("img1") || "";
  const img2 = searchParams.get("img2") || "";
  const img3 = searchParams.get("img3") || "";

  // Track Purchase event on thank you page load
  useEffect(() => {
    if (pkgTitle && pkgPrice) {
      trackMetaEvent("Purchase", {
        content_name: pkgTitle,
        value: parseInt(pkgPrice),
        currency: "NGN",
        num_items: parseInt(pkgQty) || 1,
      });
    }
  }, [pkgTitle, pkgPrice, pkgQty]);

  // Build WhatsApp message
  const whatsappMsg = [
    "Hello, I just placed an order on your store:",
    "",
    `*Name:* ${name}`,
    `*Phone:* ${phone}`,
    `*Alt Phone:* ${altPhone || "N/A"}`,
    `*Address:* ${address}`,
    `*State:* ${state}`,
    `*Package:* ${pkgTitle}`,
    `*Quantity:* ${pkgQty}`,
    `*Total:* ₦${parseInt(pkgPrice).toLocaleString()}`
  ].join("\n");

  const cleanWhatsapp = storeWhatsapp.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(whatsappMsg)}`;

  const productImagesArray = [img1, img2, img3].filter(Boolean);

  // Fetch offers
  useEffect(() => {
    (async () => {
      try {
        const { data: offersData } = await db
          .from("offers")
          .select("*")
          .eq("active", true)
          .order("sort_order", { ascending: true });
        
        const { data: productsData } = await db
          .from("products")
          .select("slug, hero_image_url");

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
        setLoadingOffers(false);
      }
    })();
  }, []);

  // Auto-rotate offers
  useEffect(() => {
    if (offers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentOfferIndex((prev) => (prev + 1) % offers.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [offers.length]); 

  const nextOffer = () => {
    setCurrentOfferIndex((prev) => (prev + 1) % offers.length);
  };

  const prevOffer = () => {
    setCurrentOfferIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/25 p-6 text-center shadow-2xl sm:p-10 relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/20 animate-pulse">
            <CheckCircle2 className="h-14 w-14 text-emerald-400" strokeWidth={2.5} />
          </div>
          <h1 className="mt-6 text-3xl font-black text-white sm:text-4xl">
            🎉 Order Placed Successfully!
          </h1>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-base leading-relaxed">
            Thank you, {name}! We've received your order and our representative will call you within 24 hours to confirm your delivery details.
          </p>

          {/* Key Info */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Delivery Time
              </p>
              <p className="mt-2 text-lg font-bold text-white">
                1–3 Days Nationwide Shipping
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Payment Method
              </p>
              <p className="mt-2 text-lg font-bold text-white">
                Pay On Delivery
              </p>
            </div>
          </div>

          {/* Product Images */}
          {productImagesArray.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-black text-white mb-4">Your Product</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {productImagesArray.map((img, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-slate-800 aspect-square relative">
                    <Image
                      src={img}
                      alt={`Product image ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WhatsApp Button */}
          <div className="mt-10">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 px-8 py-4 text-lg font-black text-white hover:brightness-110 shadow-xl shadow-emerald-500/40 active:scale-[0.97] transition-all duration-200"
            >
              <MessageCircle className="h-6 w-6" /> Chat On WhatsApp
            </a>
          </div>

          {/* Back to Home */}
          <Link
            href="/"
            onClick={() => trackMetaEvent("ClickLink", { destination: "Home from Thank You" })}
            className="mt-6 inline-block text-sm text-slate-500 underline hover:text-emerald-400 transition font-bold"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Offers Section */}
        {!loadingOffers && offers.length > 0 && (
          <div className="mt-12">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                <Gift className="h-3.5 w-3.5" /> More Offers For You
              </span>
              <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Check Out Our Other Great Offers</h2>
              <p className="mt-3 text-slate-400">Don't miss out on our limited-time bundles</p>
            </div>

            <div className="relative max-w-3xl mx-auto">
              {/* Offer Card */}
              <div className="group flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl">
                {offers[currentOfferIndex].badge && (
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-extrabold uppercase tracking-wider text-slate-950">
                    {offers[currentOfferIndex].badge}
                  </div>
                )}
                {(() => {
                  const cardImage = offers[currentOfferIndex].image_url || (offers[currentOfferIndex].product_slug ? productImages[offers[currentOfferIndex].product_slug] : undefined);
                  return cardImage ? (
                    <div className="aspect-[16/9] w-full relative">
                      <Image src={cardImage} alt={offers[currentOfferIndex].title} fill className="object-cover" />
                    </div>
                  ) : null;
                })()}
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Gift className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold">{offers[currentOfferIndex].title}</h3>
                      {offers[currentOfferIndex].description && <p className="mt-1 text-sm text-slate-400">{offers[currentOfferIndex].description}</p>}
                    </div>
                  </div>

                  <div className="mt-6 flex items-end gap-3">
                    <p className="text-4xl font-extrabold text-emerald-400">₦{offers[currentOfferIndex].price.toLocaleString()}</p>
                    {offers[currentOfferIndex].original_price && offers[currentOfferIndex].original_price > offers[currentOfferIndex].price && (
                      <p className="pb-1 text-sm text-slate-400 line-through">₦{offers[currentOfferIndex].original_price.toLocaleString()}</p>
                    )}
                  </div>

                  {offers[currentOfferIndex].product_slug ? (
                    <Link
                      href={`/product/${offers[currentOfferIndex].product_slug}#order`}
                      onClick={() => trackMetaEvent("ViewContent", { content_name: offers[currentOfferIndex].title, value: offers[currentOfferIndex].price, currency: "NGN" })}
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5"
                    >
                      View Offer <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      href="/#order"
                      onClick={() => trackMetaEvent("InitiateCheckout", { content_name: offers[currentOfferIndex].title, value: offers[currentOfferIndex].price, currency: "NGN" })}
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5"
                    >
                      Order This Bundle <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Navigation Arrows */}
              {offers.length > 1 && (
                <>
                  <button
                    onClick={prevOffer}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-12 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full shadow-lg transition"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextOffer}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-12 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full shadow-lg transition"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>

                  {/* Dots indicator */}
                  <div className="flex justify-center gap-2 mt-4">
                    {offers.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentOfferIndex(i)}
                        className={`h-2 w-2 rounded-full transition ${i === currentOfferIndex ? "bg-emerald-400 w-6" : "bg-slate-600 hover:bg-slate-500"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* View All Offers Button */}
            <div className="mt-8 text-center">
              <Link
                href="/offers"
                onClick={() => trackMetaEvent("ClickLink", { destination: "Offers from Thank You" })}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-slate-900/50 px-8 py-3.5 text-sm font-bold text-emerald-400 hover:bg-slate-800 transition"
              >
                View All Offers <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-emerald-400 animate-pulse text-xl">Loading...</div>
      </main>
    }>
      <ThankYouContent />
    </Suspense>
  );
}
