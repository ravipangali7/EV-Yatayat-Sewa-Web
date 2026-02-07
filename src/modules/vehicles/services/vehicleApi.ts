import { api, PaginatedResponse, ListParams } from '@/lib/api';
import { Vehicle, VehicleSeat, VehicleImage } from '@/types';

export const vehicleApi = {
  // List vehicles with pagination and filters
  list: async (params?: ListParams): Promise<PaginatedResponse<Vehicle>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.vehicle_type) queryParams.append('vehicle_type', params.vehicle_type);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.driver) queryParams.append('driver', params.driver);
    if (params?.route) queryParams.append('route', params.route);
    
    const queryString = queryParams.toString();
    const url = `vehicles/${queryString ? `?${queryString}` : ''}`;
    return api.get<PaginatedResponse<Vehicle>>(url);
  },

  // Get single vehicle
  get: async (id: string): Promise<Vehicle> => {
    return api.get<Vehicle>(`vehicles/${id}/`);
  },

  // Create vehicle
  create: async (data: Partial<Vehicle> & { 
    seats?: Array<{ side: string; number: number; status: string }>;
    images?: Array<{ title: string; description: string; image: File | string }>;
  }): Promise<Vehicle> => {
    // Handle file uploads
    const formData = new FormData();
    const jsonData: any = { ...data };
    
    // Handle featured_image
    if (data.featured_image instanceof File) {
      formData.append('featured_image', data.featured_image);
      delete jsonData.featured_image;
    }
    
    // Handle images
    if (data.images) {
      const imageFiles: File[] = [];
      const imageData: any[] = [];
      data.images.forEach((img, index) => {
        if (img.image instanceof File) {
          formData.append(`images[${index}].image`, img.image);
          imageFiles.push(img.image);
        }
        imageData.push({ title: img.title, description: img.description });
      });
      jsonData.images = imageData;
    }
    
    // Add JSON data
    Object.keys(jsonData).forEach(key => {
      if (key === 'seats' || key === 'images') {
        formData.append(key, JSON.stringify(jsonData[key]));
      } else if (Array.isArray(jsonData[key])) {
        jsonData[key].forEach((item: any) => formData.append(`${key}[]`, item));
      } else if (jsonData[key] !== undefined && jsonData[key] !== null) {
        formData.append(key, jsonData[key]);
      }
    });
    
    return api.upload<Vehicle>('vehicles/create/', formData);
  },

  // Edit vehicle (using POST)
  edit: async (id: string, data: Partial<Vehicle> & { 
    seats?: Array<{ side: string; number: number; status: string }>;
    images?: Array<{ title: string; description: string; image: File | string }>;
  }): Promise<Vehicle> => {
    // Check if we have files to upload
    const hasFiles = data.featured_image instanceof File || 
                     (data.images && data.images.some(img => img.image instanceof File));
    
    if (hasFiles) {
      // Use FormData for file uploads
      const formData = new FormData();
      const jsonData: any = { ...data };
      
      if (data.featured_image instanceof File) {
        formData.append('featured_image', data.featured_image);
        delete jsonData.featured_image;
      }
      
      if (data.images) {
        const imageData: any[] = [];
        data.images.forEach((img, index) => {
          if (img.image instanceof File) {
            formData.append(`images[${index}].image`, img.image);
          }
          imageData.push({ title: img.title, description: img.description });
        });
        jsonData.images = imageData;
      }
      
      Object.keys(jsonData).forEach(key => {
        if (key === 'seats' || key === 'images') {
          formData.append(key, JSON.stringify(jsonData[key]));
        } else if (Array.isArray(jsonData[key])) {
          jsonData[key].forEach((item: any) => formData.append(`${key}[]`, item));
        } else if (jsonData[key] !== undefined && jsonData[key] !== null) {
          formData.append(key, String(jsonData[key]));
        }
      });
      
      return api.upload<Vehicle>(`vehicles/${id}/edit/`, formData);
    } else {
      // Use regular POST for updates without files
      return api.post<Vehicle>(`vehicles/${id}/edit/`, data);
    }
  },

  // Delete vehicle (using GET)
  delete: async (id: string): Promise<void> => {
    return api.get<void>(`vehicles/${id}/delete/`);
  },

  // Seats
  getSeats: async (vehicleId: string): Promise<VehicleSeat[]> => {
    return api.get<VehicleSeat[]>(`vehicles/${vehicleId}/seats/`);
  },

  createSeat: async (vehicleId: string, data: { side: string; number: number; status: string }): Promise<VehicleSeat> => {
    return api.post<VehicleSeat>(`vehicles/${vehicleId}/seats/create/`, data);
  },

  editSeat: async (vehicleId: string, seatId: string, data: Partial<VehicleSeat>): Promise<VehicleSeat> => {
    return api.post<VehicleSeat>(`vehicles/${vehicleId}/seats/${seatId}/edit/`, data);
  },

  deleteSeat: async (vehicleId: string, seatId: string): Promise<void> => {
    return api.get<void>(`vehicles/${vehicleId}/seats/${seatId}/delete/`);
  },

  // Images
  getImages: async (vehicleId: string): Promise<VehicleImage[]> => {
    return api.get<VehicleImage[]>(`vehicles/${vehicleId}/images/`);
  },

  createImage: async (vehicleId: string, data: { title: string; description: string; image: File }): Promise<VehicleImage> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('image', data.image);
    return api.upload<VehicleImage>(`vehicles/${vehicleId}/images/create/`, formData);
  },

  editImage: async (vehicleId: string, imageId: string, data: Partial<VehicleImage> & { image?: File }): Promise<VehicleImage> => {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.image instanceof File) formData.append('image', data.image);
    return api.upload<VehicleImage>(`vehicles/${vehicleId}/images/${imageId}/edit/`, formData);
  },

  deleteImage: async (vehicleId: string, imageId: string): Promise<void> => {
    return api.get<void>(`vehicles/${vehicleId}/images/${imageId}/delete/`);
  },
};
