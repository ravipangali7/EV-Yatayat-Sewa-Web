import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect, MultiSelect } from '@/components/common/SearchableSelect';
import { VehicleSeatsForm } from '@/components/vehicles/VehicleSeatsForm';
import { VehicleImagesForm } from '@/components/vehicles/VehicleImagesForm';
import { 
  getVehicle, 
  getUsers, 
  getRoutes, 
  getVehicleSeats, 
  getVehicleImages,
  createVehicle, 
  updateVehicle,
  createVehicleSeat,
  deleteVehicleSeats,
  createVehicleImage,
  deleteVehicleImages
} from '@/stores/mockData';
import { VehicleSeatSide, VehicleSeatStatus } from '@/types';
import { toast } from 'sonner';

interface SeatForm {
  id: string;
  side: VehicleSeatSide;
  number: number;
  status: VehicleSeatStatus;
}

interface ImageForm {
  id: string;
  title: string;
  description: string;
  image: string;
}

export default function VehicleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const users = getUsers().filter(u => u.is_driver);
  const routes = getRoutes();

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

  useEffect(() => {
    if (isEdit && id) {
      const vehicle = getVehicle(id);
      if (vehicle) {
        setFormData({
          name: vehicle.name,
          vehicle_type: vehicle.vehicle_type,
          vehicle_no: vehicle.vehicle_no,
          imei: vehicle.imei,
          overspeed_limit: vehicle.overspeed_limit,
          odometer: vehicle.odometer,
          description: vehicle.description || '',
          featured_image: vehicle.featured_image || '',
          drivers: vehicle.drivers,
          routes: vehicle.routes,
          active_driver: vehicle.active_driver || '',
          active_route: vehicle.active_route || '',
          is_active: vehicle.is_active,
        });

        const existingSeats = getVehicleSeats(id);
        setSeats(existingSeats.map(s => ({
          id: s.id,
          side: s.side,
          number: s.number,
          status: s.status,
        })));

        const existingImages = getVehicleImages(id);
        setImages(existingImages.map(img => ({
          id: img.id,
          title: img.title,
          description: img.description,
          image: img.image,
        })));
      }
    }
  }, [id, isEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit && id) {
      updateVehicle(id, formData);

      // Update seats
      deleteVehicleSeats(id);
      seats.forEach(seat => {
        createVehicleSeat({
          vehicle: id,
          side: seat.side,
          number: seat.number,
          status: seat.status,
        });
      });

      // Update images
      deleteVehicleImages(id);
      images.forEach(img => {
        createVehicleImage({
          vehicle: id,
          title: img.title,
          description: img.description,
          image: img.image,
        });
      });

      toast.success('Vehicle updated successfully');
    } else {
      const newVehicle = createVehicle(formData);

      // Create seats
      seats.forEach(seat => {
        createVehicleSeat({
          vehicle: newVehicle.id,
          side: seat.side,
          number: seat.number,
          status: seat.status,
        });
      });

      // Create images
      images.forEach(img => {
        createVehicleImage({
          vehicle: newVehicle.id,
          title: img.title,
          description: img.description,
          image: img.image,
        });
      });

      toast.success('Vehicle created successfully');
    }
    navigate('/app/vehicles');
  };

  const driverOptions = users.map(u => ({ value: u.id, label: u.name }));
  const routeOptions = routes.map(r => ({ value: r.id, label: r.name }));

  // Filter options for active driver/route to only include selected ones
  const activeDriverOptions = driverOptions.filter(o => formData.drivers.includes(o.value));
  const activeRouteOptions = routeOptions.filter(o => formData.routes.includes(o.value));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
        backUrl="/app/vehicles"
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
          <Button type="submit">{isEdit ? 'Update' : 'Create'} Vehicle</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/app/vehicles')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
