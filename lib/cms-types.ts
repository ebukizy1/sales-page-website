// Local types for CMS tables not yet in generated Database type.
// Use via the `db` helper which casts the supabase client to bypass typing.
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

export type Product = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  long_description: string | null;
  hero_image_url: string | null;
  packaging_image_url: string | null;
  night_image_url: string | null;
  specs_image_url: string | null;
  video_url: string | null;
  warranty_text: string | null;
  delivery_text: string | null;
  active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
  
  // Dynamic Funnel Hero fields
  tagline: string | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_description: string | null;
  hero_cta_text: string | null;
  hero_cta_link: string | null;
  price: number | null;
  discount_price: number | null;
  stock_status: string | null;

  // Dynamic Funnel Section fields
  features_section_title: string | null;
  features_section_subtitle: string | null;
  bills_section_title: string | null;
  bills_section_description: string | null;
  bills_section_list: string | null;
  security_section_title: string | null;
  security_section_description: string | null;
  security_media_type: string | null;
  specs_section_title: string | null;
  specs_section_subtitle: string | null;

  // Dynamic Funnel Final CTA fields
  final_cta_headline: string | null;
  final_cta_subheadline: string | null;
  final_cta_button_text: string | null;
  final_cta_button_link: string | null;
  final_cta_bg_image_url: string | null;
};

export type Spec = { id: string; product_id: string; label: string; value: string; sort_order: number };
export type Feature = { id: string; product_id: string; title: string; description: string | null; icon: string | null; sort_order: number };
export type GalleryImage = { id: string; product_id: string; url: string; alt: string | null; sort_order: number; image_type: string | null };
export type Package = {
  id: string;
  product_id: string | null;
  package_code: string;
  title: string;
  quantity: number;
  price: number;
  bonus_text: string | null;
  sort_order: number;
  active: boolean;
};
export type SiteSettings = {
  id: number;
  store_name: string | null;
  site_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  delivery_text: string | null;
  warranty_text: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  created_at: string;
  updated_at: string;
};
export type Offer = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  original_price: number | null;
  badge: string | null;
  image_url: string | null;
  product_slug: string | null;
  sort_order: number;
  active: boolean;
};

export type Review = {
  id: string;
  product_id: string;
  customer_name: string;
  customer_location: string | null;
  customer_photo_url: string | null;
  rating: number;
  review_text: string;
  sort_order: number;
  created_at: string;
};

export type FAQ = {
  id: string;
  product_id: string;
  question: string;
  answer: string;
  sort_order: number;
  created_at: string;
};
