import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { BusSeatVisualizer } from '@/components/vehicles/BusSeatVisualizer';
import { SeatBookingMap } from '@/components/seat-bookings/SeatBookingMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { seatBookingApi } from '@/modules/seat-bookings/services/seatBookingApi';
import { vehicleApi } from '@/modules/vehicles/services/vehicleApi';
import { userApi } from '@/modules/users/services/userApi';
import { superSettingApi } from '@/modules/settings/services/superSettingApi';
import { SeatBooking, Vehicle, VehicleSeat } from '@/types';
import { toast } from 'sonner';
import { format, differenceInSeconds } from 'date-fns';

export default function SeatBookingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [vehicles, setVehicles] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; phone: string }>>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [perKmCharge, setPerKmCharge] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    user: '',
    is_guest: false,
    vehicle: '',
    vehicle_seat: '',
    check_in_lat: '',
    check_in_lng: '',
    check_in_datetime: '',
    check_in_address: '',
    check_out_lat: '',
    check_out_lng: '',
    check_out_datetime: '',
    check_out_address: '',
    trip_distance: '',
    trip_duration: '',
    trip_amount: '',
    is_paid: false,
  });

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesResponse, usersResponse, settingsResponse] = await Promise.all([
          vehicleApi.list({ per_page: 1000 }),
          userApi.list({ per_page: 1000 }),
          superSettingApi.list({ per_page: 1 }),
        ]);

        setVehicles(vehiclesResponse.results.map(v => ({ id: v.id, name: v.name })));

        setUsers(usersResponse.results.map(u => ({ 
          id: u.id, 
          name: u.name || u.username,
          phone: u.phone 
        })));

        if (settingsResponse.results.length > 0) {
          setPerKmCharge(settingsResponse.results[0].per_km_charge);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    fetchData();
  }, []);

  // Load booking for edit
  useEffect(() => {
    const fetchBooking = async () => {
      if (isEdit && id) {
        try {
          setLoading(true);
          const booking = await seatBookingApi.get(id);
          
          setFormData({
            user: booking.user || '',
            is_guest: booking.is_guest || false,
            vehicle: booking.vehicle,
            vehicle_seat: booking.vehicle_seat,
            check_in_lat: booking.check_in_lat.toString(),
            check_in_lng: booking.check_in_lng.toString(),
            check_in_datetime: booking.check_in_datetime 
              ? format(new Date(booking.check_in_datetime), "yyyy-MM-dd'T'HH:mm")
              : '',
            check_in_address: booking.check_in_address || '',
            check_out_lat: booking.check_out_lat?.toString() || '',
            check_out_lng: booking.check_out_lng?.toString() || '',
            check_out_datetime: booking.check_out_datetime 
              ? format(new Date(booking.check_out_datetime), "yyyy-MM-dd'T'HH:mm")
              : '',
            check_out_address: booking.check_out_address || '',
            trip_distance: booking.trip_distance?.toString() || '',
            trip_duration: booking.trip_duration?.toString() || '',
            trip_amount: booking.trip_amount?.toString() || '',
            is_paid: booking.is_paid || false,
          });

          if (booking.vehicle) {
            const vehicle = await vehicleApi.get(booking.vehicle);
            setSelectedVehicle(vehicle);
          }
        } catch (error) {
          toast.error('Failed to load seat booking');
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchBooking();
  }, [id, isEdit]);

  // Load vehicle when selected
  useEffect(() => {
    const loadVehicle = async () => {
      if (formData.vehicle) {
        try {
          const vehicle = await vehicleApi.get(formData.vehicle);
          setSelectedVehicle(vehicle);
        } catch (error) {
          console.error('Failed to load vehicle:', error);
          setSelectedVehicle(null);
        }
      } else {
        setSelectedVehicle(null);
        setFormData(prev => ({ ...prev, vehicle_seat: '' }));
      }
    };
    loadVehicle();
  }, [formData.vehicle]);

  // Calculate trip duration when datetimes change
  useEffect(() => {
    if (formData.check_in_datetime && formData.check_out_datetime) {
      try {
        const checkIn = new Date(formData.check_in_datetime);
        const checkOut = new Date(formData.check_out_datetime);
        if (checkOut > checkIn) {
          const duration = differenceInSeconds(checkOut, checkIn);
          setFormData(prev => ({ ...prev, trip_duration: duration.toString() }));
        }
      } catch (error) {
        console.error('Error calculating duration:', error);
      }
    }
  }, [formData.check_in_datetime, formData.check_out_datetime]);

  // Calculate trip amount when distance changes
  useEffect(() => {
    if (formData.trip_distance && perKmCharge > 0) {
      const distance = parseFloat(formData.trip_distance);
      if (!isNaN(distance)) {
        const amount = distance * perKmCharge;
        setFormData(prev => ({ ...prev, trip_amount: amount.toFixed(2) }));
      }
    }
  }, [formData.trip_distance, perKmCharge]);

  const handleCheckInChange = (lat: number, lng: number, address: string) => {
    setFormData(prev => ({
      ...prev,
      check_in_lat: lat.toString(),
      check_in_lng: lng.toString(),
      check_in_address: address,
    }));
  };

  const handleCheckOutChange = (lat: number, lng: number, address: string) => {
    setFormData(prev => ({
      ...prev,
      check_out_lat: lat.toString(),
      check_out_lng: lng.toString(),
      check_out_address: address,
    }));
  };

  const handleDistanceChange = (distance: number) => {
    setFormData(prev => ({
      ...prev,
      trip_distance: distance.toFixed(2),
    }));
  };

  const handleSeatClick = (seat: VehicleSeat) => {
    if (seat.status === 'available') {
      setFormData(prev => ({ ...prev, vehicle_seat: seat.id }));
    }
  };

  // Form validation
  const isFormValid = useMemo(() => {
    if (!formData.vehicle) return false;
    if (!formData.vehicle_seat) return false;
    if (!formData.check_in_lat || !formData.check_in_lng) return false;
    if (!formData.check_in_address) return false;
    if (!formData.check_in_datetime) return false;
    
    // If check out is provided, all check out fields must be filled
    if (formData.check_out_lat || formData.check_out_lng || formData.check_out_datetime) {
      if (!formData.check_out_lat || !formData.check_out_lng || !formData.check_out_address || !formData.check_out_datetime) {
        return false;
      }
      // If both locations provided, distance and amount must be calculated
      if (!formData.trip_distance || !formData.trip_amount) {
        return false;
      }
    }

    // If not guest, user must be selected
    if (!formData.is_guest && !formData.user) {
      return false;
    }

    return true;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const submitData: any = {
        vehicle: formData.vehicle,
        vehicle_seat: formData.vehicle_seat,
        check_in_lat: parseFloat(formData.check_in_lat),
        check_in_lng: parseFloat(formData.check_in_lng),
        check_in_datetime: formData.check_in_datetime,
        check_in_address: formData.check_in_address,
        is_guest: formData.is_guest,
        is_paid: formData.is_paid,
      };

      if (!formData.is_guest) {
        submitData.user = formData.user;
      }

      if (formData.check_out_lat && formData.check_out_lng) {
        submitData.check_out_lat = parseFloat(formData.check_out_lat);
        submitData.check_out_lng = parseFloat(formData.check_out_lng);
        submitData.check_out_datetime = formData.check_out_datetime;
        submitData.check_out_address = formData.check_out_address;
        
        if (formData.trip_distance) {
          submitData.trip_distance = parseFloat(formData.trip_distance);
        }
        if (formData.trip_duration) {
          submitData.trip_duration = parseInt(formData.trip_duration);
        }
        if (formData.trip_amount) {
          submitData.trip_amount = parseFloat(formData.trip_amount);
        }
      }

      if (id) {
        await seatBookingApi.edit(id, submitData);
        toast.success('Seat booking updated successfully');
      } else {
        await seatBookingApi.create(submitData);
        toast.success('Seat booking created successfully');
      }
      navigate('/admin/seat-bookings');
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} seat booking`);
    } finally {
      setLoading(false);
    }
  };

  const availableSeats = selectedVehicle?.seats?.filter(s => s.status === 'available') || [];

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Seat Booking' : 'Create Seat Booking'}
        subtitle={isEdit ? 'Update seat booking details' : 'Create a new seat booking'}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Vehicle Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle *</Label>
              <SearchableSelect
                options={vehicles}
                value={formData.vehicle}
                onChange={(value) => setFormData({ ...formData, vehicle: value, vehicle_seat: '' })}
                placeholder="Select vehicle"
                getOptionLabel={(option) => option.name}
                getOptionValue={(option) => option.id}
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Seat Layout */}
        {selectedVehicle && selectedVehicle.seats && selectedVehicle.seats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Select Seat</CardTitle>
              <p className="text-sm text-muted-foreground">
                Click on an available seat to select it
              </p>
            </CardHeader>
            <CardContent>
              <BusSeatVisualizer
                seats={selectedVehicle.seats}
                selectedSeatId={formData.vehicle_seat}
                onSeatClick={handleSeatClick}
                onlyAvailable={true}
              />
              {formData.vehicle_seat && (
                <div className="mt-4 p-3 bg-primary/10 rounded-md">
                  <p className="text-sm font-medium">
                    Selected: {selectedVehicle.seats.find(s => s.id === formData.vehicle_seat)?.side}
                    {selectedVehicle.seats.find(s => s.id === formData.vehicle_seat)?.number}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Map with Check In/Check Out */}
        {formData.vehicle_seat && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Set Locations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select Check In or Check Out tab, then click on the map or search for a location
              </p>
            </CardHeader>
            <CardContent>
              <SeatBookingMap
                checkInLat={formData.check_in_lat ? parseFloat(formData.check_in_lat) : undefined}
                checkInLng={formData.check_in_lng ? parseFloat(formData.check_in_lng) : undefined}
                checkInAddress={formData.check_in_address}
                checkOutLat={formData.check_out_lat ? parseFloat(formData.check_out_lat) : undefined}
                checkOutLng={formData.check_out_lng ? parseFloat(formData.check_out_lng) : undefined}
                checkOutAddress={formData.check_out_address}
                onCheckInChange={handleCheckInChange}
                onCheckOutChange={handleCheckOutChange}
                onDistanceChange={handleDistanceChange}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 4: Date/Time Selection */}
        {(formData.check_in_lat || formData.check_out_lat) && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Set Date & Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="check_in_datetime">Check In Date & Time *</Label>
                  <Input
                    id="check_in_datetime"
                    type="datetime-local"
                    value={formData.check_in_datetime}
                    onChange={(e) => setFormData({ ...formData, check_in_datetime: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="check_out_datetime">Check Out Date & Time</Label>
                  <Input
                    id="check_out_datetime"
                    type="datetime-local"
                    value={formData.check_out_datetime}
                    onChange={(e) => setFormData({ ...formData, check_out_datetime: e.target.value })}
                    min={formData.check_in_datetime}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Trip Details & User Info */}
        {formData.check_in_datetime && (
          <Card>
            <CardHeader>
              <CardTitle>Step 5: Trip Details & User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trip Details (Auto-calculated) */}
              {(formData.trip_distance || formData.trip_duration || formData.trip_amount) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-md">
                  {formData.trip_distance && (
                    <div>
                      <Label className="text-muted-foreground">Trip Distance</Label>
                      <p className="text-lg font-semibold">{parseFloat(formData.trip_distance).toFixed(2)} km</p>
                    </div>
                  )}
                  {formData.trip_duration && (
                    <div>
                      <Label className="text-muted-foreground">Trip Duration</Label>
                      <p className="text-lg font-semibold">
                        {Math.floor(parseInt(formData.trip_duration) / 3600)}h{' '}
                        {Math.floor((parseInt(formData.trip_duration) % 3600) / 60)}m
                      </p>
                    </div>
                  )}
                  {formData.trip_amount && (
                    <div>
                      <Label className="text-muted-foreground">Trip Amount</Label>
                      <p className="text-lg font-semibold text-primary">Rs. {parseFloat(formData.trip_amount).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* User/Guest Selection */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_guest"
                  checked={formData.is_guest}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_guest: checked, user: '' })}
                />
                <Label htmlFor="is_guest">Is Guest</Label>
              </div>

              {!formData.is_guest && (
                <div className="space-y-2">
                  <Label htmlFor="user">User *</Label>
                  <SearchableSelect
                    options={users}
                    value={formData.user}
                    onChange={(value) => setFormData({ ...formData, user: value })}
                    placeholder="Select user"
                    getOptionLabel={(option) => `${option.name} (${option.phone})`}
                    getOptionValue={(option) => option.id}
                  />
                </div>
              )}

              {/* Payment Status */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_paid"
                  checked={formData.is_paid}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_paid: checked })}
                />
                <Label htmlFor="is_paid">Payment Received</Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/seat-bookings')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !isFormValid}>
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'} Booking
          </Button>
        </div>

        {!isFormValid && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-md">
            <p className="text-sm text-warning">
              Please complete all required fields: Vehicle, Seat, Check In location & datetime
              {formData.check_out_lat && ' (and Check Out if provided)'}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
