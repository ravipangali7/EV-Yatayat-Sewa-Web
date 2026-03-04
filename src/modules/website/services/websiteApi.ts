import { api, PaginatedResponse, ListParams } from '@/lib/api';
import type {
  Slider,
  CMSPage,
  Team,
  Testimonial,
  Service,
  FAQ,
  ContactMessage,
  Blog,
  SiteSetting,
  PublicVehicle,
} from '../types';

const P = 'website/';

export const websitePublicApi = {
  sliders: () => api.get<Slider[]>(`${P}sliders/`),
  siteSetting: () => api.get<SiteSetting | Record<string, never>>(`${P}site-setting/`),
  cmsAbout: () => api.get<CMSPage | null>(`${P}cms-pages/about/`),
  cmsBySlug: (slug: string) => api.get<CMSPage>(`${P}cms-pages/by-slug/${slug}/`),
  cmsHeader: () => api.get<CMSPage[]>(`${P}cms-pages/header/`),
  services: () => api.get<Service[]>(`${P}services/`),
  team: () => api.get<Team[]>(`${P}team/`),
  testimonials: () => api.get<Testimonial[]>(`${P}testimonials/`),
  blogs: () => api.get<Blog[]>(`${P}blogs/`),
  blogBySlug: (slug: string) => api.get<Blog>(`${P}blogs/by-slug/${slug}/`),
  faqs: () => api.get<FAQ[]>(`${P}faqs/`),
  contactSubmit: (data: { name: string; phone: string; message: string }) =>
    api.post<{ message: string }>(`${P}contact-messages/`, data),
  vehicles: () => api.get<PublicVehicle[]>(`${P}vehicles/`),
};

// Admin APIs (authenticated)
export const sliderApi = {
  list: (params?: ListParams) =>
    api.get<PaginatedResponse<Slider>>('sliders/', { params }),
  get: (id: string) => api.get<Slider>(`sliders/${id}/`),
  create: (data: FormData | Partial<Slider>) =>
    data instanceof FormData
      ? api.upload<Slider>('sliders/create/', data)
      : api.post<Slider>('sliders/create/', data),
  edit: (id: string, data: FormData | Partial<Slider>) =>
    data instanceof FormData
      ? api.upload<Slider>(`sliders/${id}/edit/`, data)
      : api.post<Slider>(`sliders/${id}/edit/`, data),
  delete: (id: string) => api.get<void>(`sliders/${id}/delete/`),
};

export const cmsPageApi = {
  list: (params?: ListParams) =>
    api.get<PaginatedResponse<CMSPage>>('cms-pages/', { params }),
  get: (id: string) => api.get<CMSPage>(`cms-pages/${id}/`),
  create: (data: FormData | Partial<CMSPage>) =>
    data instanceof FormData
      ? api.upload<CMSPage>('cms-pages/create/', data)
      : api.post<CMSPage>('cms-pages/create/', data),
  edit: (id: string, data: FormData | Partial<CMSPage>) =>
    data instanceof FormData
      ? api.upload<CMSPage>(`cms-pages/${id}/edit/`, data)
      : api.post<CMSPage>(`cms-pages/${id}/edit/`, data),
  delete: (id: string) => api.get<void>(`cms-pages/${id}/delete/`),
};

export const teamApi = {
  list: (params?: ListParams) =>
    api.get<PaginatedResponse<Team>>('team/', { params }),
  get: (id: string) => api.get<Team>(`team/${id}/`),
  create: (data: FormData | Partial<Team>) =>
    data instanceof FormData
      ? api.upload<Team>('team/create/', data)
      : api.post<Team>('team/create/', data),
  edit: (id: string, data: FormData | Partial<Team>) =>
    data instanceof FormData
      ? api.upload<Team>(`team/${id}/edit/`, data)
      : api.post<Team>(`team/${id}/edit/`, data),
  delete: (id: string) => api.get<void>(`team/${id}/delete/`),
  reorder: (items: { id: number; order: number }[]) =>
    api.post<{ message: string }>('team/reorder/', { items }),
};

export const testimonialApi = {
  list: (params?: ListParams) =>
    api.get<PaginatedResponse<Testimonial>>('testimonials/', { params }),
  get: (id: string) => api.get<Testimonial>(`testimonials/${id}/`),
  create: (data: FormData | Partial<Testimonial>) =>
    data instanceof FormData
      ? api.upload<Testimonial>('testimonials/create/', data)
      : api.post<Testimonial>('testimonials/create/', data),
  edit: (id: string, data: FormData | Partial<Testimonial>) =>
    data instanceof FormData
      ? api.upload<Testimonial>(`testimonials/${id}/edit/`, data)
      : api.post<Testimonial>(`testimonials/${id}/edit/`, data),
  delete: (id: string) => api.get<void>(`testimonials/${id}/delete/`),
};

export const serviceApi = {
  list: (params?: ListParams) =>
    api.get<PaginatedResponse<Service>>('services/', { params }),
  get: (id: string) => api.get<Service>(`services/${id}/`),
  create: (data: FormData | Partial<Service>) =>
    data instanceof FormData
      ? api.upload<Service>('services/create/', data)
      : api.post<Service>('services/create/', data),
  edit: (id: string, data: FormData | Partial<Service>) =>
    data instanceof FormData
      ? api.upload<Service>(`services/${id}/edit/`, data)
      : api.post<Service>(`services/${id}/edit/`, data),
  delete: (id: string) => api.get<void>(`services/${id}/delete/`),
  reorder: (items: { id: number; order: number }[]) =>
    api.post<{ message: string }>('services/reorder/', { items }),
};

export const faqApi = {
  list: (params?: ListParams) =>
    api.get<PaginatedResponse<FAQ>>('faqs/', { params }),
  get: (id: string) => api.get<FAQ>(`faqs/${id}/`),
  create: (data: Partial<FAQ>) => api.post<FAQ>('faqs/create/', data),
  edit: (id: string, data: Partial<FAQ>) =>
    api.post<FAQ>(`faqs/${id}/edit/`, data),
  delete: (id: string) => api.get<void>(`faqs/${id}/delete/`),
  reorder: (items: { id: number; order: number }[]) =>
    api.post<{ message: string }>('faqs/reorder/', { items }),
};

export const contactMessageApi = {
  list: (params?: ListParams) =>
    api.get<PaginatedResponse<ContactMessage>>('contact-messages/', { params }),
  get: (id: string) => api.get<ContactMessage>(`contact-messages/${id}/`),
  edit: (id: string, data: Partial<ContactMessage>) =>
    api.post<ContactMessage>(`contact-messages/${id}/edit/`, data),
  delete: (id: string) => api.get<void>(`contact-messages/${id}/delete/`),
};

export const blogApi = {
  list: (params?: ListParams) =>
    api.get<PaginatedResponse<Blog>>('blogs/', { params }),
  get: (id: string) => api.get<Blog>(`blogs/${id}/`),
  create: (data: FormData | Partial<Blog>) =>
    data instanceof FormData
      ? api.upload<Blog>('blogs/create/', data)
      : api.post<Blog>('blogs/create/', data),
  edit: (id: string, data: FormData | Partial<Blog>) =>
    data instanceof FormData
      ? api.upload<Blog>(`blogs/${id}/edit/`, data)
      : api.post<Blog>(`blogs/${id}/edit/`, data),
  delete: (id: string) => api.get<void>(`blogs/${id}/delete/`),
};

export const siteSettingApi = {
  get: () => api.get<SiteSetting>('site-setting/'),
  edit: (data: FormData | Partial<SiteSetting>) =>
    data instanceof FormData
      ? api.upload<SiteSetting>('site-setting/edit/', data)
      : api.post<SiteSetting>('site-setting/edit/', data),
};
