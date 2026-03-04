export interface Slider {
  id: number;
  title: string;
  subtitle: string;
  image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CMSPage {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  content: string;
  is_active: boolean;
  is_footer: boolean;
  is_header: boolean;
  is_about: boolean;
  section_in: number | null;
  child_sections?: CMSPage[];
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: number;
  order: number;
  name: string;
  image: string | null;
  designation: string;
  phone: string;
  email: string;
  address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: number;
  name: string;
  message: string;
  star: number;
  image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  svg: string;
  description: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  phone: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Blog {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StatItem {
  label: string;
  svg: string;
  value: string;
}

export interface SiteSetting {
  id: number;
  logo: string | null;
  name: string;
  tagline: string;
  phones: string[];
  emails: string[];
  address: string;
  map: string;
  cover_image: string | null;
  footer_text: string;
  stats: { stats: StatItem[] };
  created_at: string;
  updated_at: string;
}

export interface PublicVehicle {
  id: number;
  name: string;
  vehicle_no: string;
  vehicle_type: string;
  description: string;
  featured_image: string | null;
}
