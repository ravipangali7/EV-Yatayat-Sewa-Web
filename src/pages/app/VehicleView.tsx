import { useParams, useNavigate } from 'react-router-dom';
import { Edit } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { BusSeatVisualizer } from '@/components/vehicles/BusSeatVisualizer';
import { getVehicle, getUsers, getRoutes, getVehicleSeats, getVehicleImages } from '@/stores/mockData';

export default function VehicleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const vehicle = id ? getVehicle(id) : null;
  const users = getUsers();
  const routes = getRoutes();
  const seats = id ? getVehicleSeats(id) : [];
  const images = id ? getVehicleImages(id) : [];

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vehicle not found</p>
        <Button className="mt-4" onClick={() => navigate('/app/vehicles')}>
          Back to Vehicles
        </Button>
      </div>
    );
  }

  const getDriverNames = () => {
    return vehicle.drivers.map(dId => {
      const driver = users.find(u => u.id === dId);
      return driver?.name || 'Unknown';
    });
  };

  const getRouteNames = () => {
    return vehicle.routes.map(rId => {
      const route = routes.find(r => r.id === rId);
      return route?.name || 'Unknown';
    });
  };

  return (
    <div>
      <PageHeader
        title="Vehicle Details"
        subtitle={vehicle.name}
        backUrl="/app/vehicles"
        actions={
          <Button onClick={() => navigate(`/app/vehicles/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{vehicle.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Vehicle No</span>
              <span className="font-medium">{vehicle.vehicle_no}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{vehicle.vehicle_type}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">IMEI</span>
              <span className="font-medium">{vehicle.imei}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Odometer</span>
              <span className="font-medium">{vehicle.odometer.toLocaleString()} km</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Overspeed Limit</span>
              <span className="font-medium">{vehicle.overspeed_limit} km/h</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={vehicle.is_active ? 'active' : 'inactive'} />
            </div>
          </CardContent>
        </Card>

        {/* Drivers & Routes */}
        <Card>
          <CardHeader>
            <CardTitle>Drivers & Routes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Assigned Drivers</h4>
              <div className="flex flex-wrap gap-2">
                {getDriverNames().map((name, i) => (
                  <Badge key={i} variant="secondary">{name}</Badge>
                ))}
                {getDriverNames().length === 0 && (
                  <span className="text-muted-foreground text-sm">No drivers assigned</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Assigned Routes</h4>
              <div className="flex flex-wrap gap-2">
                {getRouteNames().map((name, i) => (
                  <Badge key={i} variant="secondary">{name}</Badge>
                ))}
                {getRouteNames().length === 0 && (
                  <span className="text-muted-foreground text-sm">No routes assigned</span>
                )}
              </div>
            </div>

            {vehicle.active_driver && (
              <div className="flex justify-between items-center py-2 border-t border-border">
                <span className="text-muted-foreground">Active Driver</span>
                <Badge>{users.find(u => u.id === vehicle.active_driver)?.name || 'Unknown'}</Badge>
              </div>
            )}

            {vehicle.active_route && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Active Route</span>
                <Badge>{routes.find(r => r.id === vehicle.active_route)?.name || 'Unknown'}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seat Layout */}
        {seats.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Seat Layout</CardTitle>
            </CardHeader>
            <CardContent>
              <BusSeatVisualizer seats={seats} />
            </CardContent>
          </Card>
        )}

        {/* Images */}
        {images.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Vehicle Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img) => (
                  <div key={img.id} className="space-y-2">
                    <img
                      src={img.image}
                      alt={img.title}
                      className="w-full h-32 object-cover rounded-lg border border-border"
                    />
                    <p className="font-medium text-sm">{img.title}</p>
                    {img.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{img.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
