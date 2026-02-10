import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect, MultiSelect } from '@/components/common/SearchableSelect';
import { VehicleSeatsForm } from '@/components/vehicles/VehicleSeatsForm';
import { VehicleImagesForm, ImageForm } from '@/components/vehicles/VehicleImagesForm';
import { vehicleApi } from '@/modules/vehicles/services/vehicleApi';
import { userApi } from '@/modules/users/services/userApi';
import { routeApi } from '@/modules/routes/services/routeApi';
import { VehicleSeatSide, VehicleSeatStatus } from '@/types';
import { toast } from 'sonner';

interface SeatForm {
  id: string;
  side: VehicleSeatSide;
  number: number;
  status: VehicleSeatStatus;
}

export default function VehicleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [routes, setRoutes] = useState<Array<{ id: string; name: string }>>([]);

  const [formData, setFormData] = useState({
    name: '',
    vehicle_type: '',
    vehicle_no: '',
    imei: '',
    overspeed_limit: 80,
    odometer: 0,
    description: '',
    featured_image: '',
    drivers: [] as string[],
    routes: [] as string[],
    active_driver: '',
    active_route: '',
    is_active: true,
  });

  const [seats, setSeats] = useState<SeatForm[]>([]);
  const [images, setImages] = useState<ImageForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch drivers
        const driversResponse = await userApi.list({ is_driver: true, per_page: 1000 });
        setUsers(driversResponse.results.map(u => ({ id: u.id, name: u.name || u.username })));

        // Fetch routes
        const routesResponse = await routeApi.list({ per_page: 1000 });
        setRoutes(routesResponse.results.map(r => ({ id: r.id, name: r.name })));
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchVehicle = async () => {
      if (isEdit && id) {
        try {
          setLoading(true);
          const vehicle = await vehicleApi.get(id);
          
          // Construct full media URL for featured image if it exists
          const featuredImageUrl = vehicle.featured_image
            ? vehicle.featured_image.startsWith('http')
              ? vehicle.featured_image
              : `http://127.0.0.1:8000${vehicle.featured_image}`
            : '';
          
          setFormData({
            name: vehicle.name || '',
            vehicle_type: vehicle.vehicle_type || '',
            vehicle_no: vehicle.vehicle_no || '',
            imei: vehicle.imei || '',
            overspeed_limit: vehicle.overspeed_limit || 80,
            odometer: vehicle.odometer || 0,
            description: vehicle.description || '',
            featured_image: featuredImageUrl,
            drivers: vehicle.drivers || [],
            routes: vehicle.routes || [],
            active_driver: vehicle.active_driver || '',
            active_route: vehicle.active_route || '',
            is_active: vehicle.is_active ?? true,
          });

          if (vehicle.seats) {
            setSeats(vehicle.seats.map(s => ({
              id: s.id,
              side: s.side,
              number: s.number,
              status: s.status,
            })));
          }

          if (vehicle.images) {
            setImages(vehicle.images.map(img => {
              // Construct full media URL for existing images
              const imageUrl = img.image
                ? img.image.startsWith('http')
                  ? img.image
                  : `http://127.0.0.1:8000${img.image}`
                : '';
              return {
                id: img.id,
                title: img.title || '',
                description: img.description || '',
                image: imageUrl,
              };
            }));
          }
          
          // Reset featured image file when loading existing vehicle
          setFeaturedImageFile(null);
        } catch (error) {
          toast.error('Failed to load vehicle');
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchVehicle();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const vehicleData: any = {
        ...formData,
        // Only include featured_image if it's a File object (new upload)
        // If no new file, don't include it - Django will keep existing image
      };
      
      // Only add featured_image if we have a new File to upload
      if (featuredImageFile) {
        vehicleData.featured_image = featuredImageFile;
      } else {
        // Remove featured_image from formData since it's just a preview string
        delete vehicleData.featured_image;
      }
      
      vehicleData.seats = seats.map(seat => ({
        side: seat.side,
        number: seat.number,
        status: seat.status,
      }));
      
      // For images: only include ones with File objects (new uploads)
      // Existing images (strings) are preserved by Django if images_data is not sent
      // But if we're editing and have any new images, we need to send all images
      // For now, let's only send images that have File objects when editing
      if (isEdit) {
        // When editing, only send images that have File objects (new uploads)
        const newImages = images.filter(img => img.image instanceof File);
        if (newImages.length > 0) {
          vehicleData.images = newImages.map(img => ({
            title: img.title,
            description: img.description,
            image: img.image as File,
          }));
        }
        // If no new images, don't send images_data - Django will keep existing images
      } else {
        // When creating, send all images (they should all be File objects for new vehicles)
        vehicleData.images = images.map(img => ({
          title: img.title,
          description: img.description,
          image: img.image instanceof File ? img.image : '',
        }));
      }

      if (isEdit && id) {
        await vehicleApi.edit(id, vehicleData);
        toast.success('Vehicle updated successfully');
      } else {
        await vehicleApi.create(vehicleData);
        toast.success('Vehicle created successfully');
      }
      navigate('/admin/vehicles');
    } catch (error) {
      console.error(error);
      // Error is already handled by API interceptor
    } finally {
      setLoading(false);
    }
  };

  const driverOptions = users.map(u => ({ value: u.id, label: u.name }));
  const routeOptions = routes.map(r => ({ value: r.id, label: r.name }));

  // Filter options for active driver/route to only include selected ones
  const activeDriverOptions = driverOptions.filter(o => formData.drivers.includes(o.value));
  const activeRouteOptions = routeOptions.filter(o => formData.routes.includes(o.value));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the File object for upload
      setFeaturedImageFile(file);
      // Create preview URL for display
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({ ...formData, featured_image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
        subtitle={isEdit ? 'Update vehicle information' : 'Create a new vehicle'}
        backUrl="/admin/vehicles"
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Basic Info */}
        <div className="form-section">
          <h3 className="font-semibold text-foreground mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_type">Vehicle Type</Label>
              <Input
                id="vehicle_type"
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                placeholder="e.g., Bus, Minibus"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_no">Vehicle Number</Label>
              <Input
                id="vehicle_no"
                value={formData.vehicle_no}
                onChange={(e) => setFormData({ ...formData, vehicle_no: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imei">IMEI</Label>
              <Input
                id="imei"
                value={formData.imei}
                onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="overspeed_limit">Overspeed Limit (km/h)</Label>
              <Input
                id="overspeed_limit"
                type="number"
                value={formData.overspeed_limit}
                onChange={(e) => setFormData({ ...formData, overspeed_limit: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="odometer">Odometer (km)</Label>
              <Input
                id="odometer"
                type="number"
                value={formData.odometer}
                onChange={(e) => setFormData({ ...formData, odometer: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label>Featured Image</Label>
              <Input type="file" accept="image/*" onChange={handleFileChange} />
              {formData.featured_image && (
                <img
                  src={formData.featured_image}
                  alt="Featured"
                  className="mt-2 h-32 w-auto rounded-lg border border-border"
                />
              )}
            </div>
          </div>
        </div>

        {/* Drivers & Routes */}
        <div className="form-section">
          <h3 className="font-semibold text-foreground mb-4">Drivers & Routes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Drivers</Label>
              <MultiSelect
                options={driverOptions}
                value={formData.drivers}
                onChange={(value) => setFormData({ ...formData, drivers: value })}
                placeholder="Select drivers..."
              />
            </div>

            <div className="space-y-2">
              <Label>Routes</Label>
              <MultiSelect
                options={routeOptions}
                value={formData.routes}
                onChange={(value) => setFormData({ ...formData, routes: value })}
                placeholder="Select routes..."
              />
            </div>

            {isEdit && (
              <>
                <div className="space-y-2">
                  <Label>Active Driver</Label>
                  <SearchableSelect
                    options={activeDriverOptions}
                    value={formData.active_driver}
                    onChange={(value) => setFormData({ ...formData, active_driver: value })}
                    placeholder="Select active driver..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Active Route</Label>
                  <SearchableSelect
                    options={activeRouteOptions}
                    value={formData.active_route}
                    onChange={(value) => setFormData({ ...formData, active_route: value })}
                    placeholder="Select active route..."
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Vehicle Seats */}
        <div className="form-section">
          <VehicleSeatsForm value={seats} onChange={setSeats} />
        </div>

        {/* Vehicle Images */}
        <div className="form-section">
          <VehicleImagesForm value={images} onChange={setImages} />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>{isEdit ? 'Update' : 'Create'} Vehicle</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/vehicles')} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
