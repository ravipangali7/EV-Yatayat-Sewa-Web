import { User, Wallet, Transaction, SuperSetting, Place, Route, Vehicle, VehicleSeat, VehicleImage, RouteStopPoint } from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    phone: '+1234567890',
    email: 'admin@fleetapp.com',
    name: 'Admin User',
    is_driver: false,
    is_superuser: true,
    is_staff: true,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    username: 'john_driver',
    phone: '+1987654321',
    email: 'john@fleetapp.com',
    name: 'John Smith',
    is_driver: true,
    is_superuser: false,
    is_staff: false,
    is_active: true,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '3',
    username: 'sarah_driver',
    phone: '+1122334455',
    email: 'sarah@fleetapp.com',
    name: 'Sarah Johnson',
    is_driver: true,
    is_superuser: false,
    is_staff: false,
    is_active: true,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
];

// Mock Wallets
export const mockWallets: Wallet[] = [
  {
    id: '1',
    user: '2',
    balance: 1250.50,
    to_be_pay: 150.00,
    to_be_received: 320.00,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
  },
  {
    id: '2',
    user: '3',
    balance: 890.75,
    to_be_pay: 75.00,
    to_be_received: 180.00,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-05T00:00:00Z',
  },
];

// Mock Transactions
export const mockTransactions: Transaction[] = [
  {
    id: '1',
    status: 'success',
    balance_before: 1000.00,
    balance_after: 1250.50,
    amount: 250.50,
    wallet: '1',
    user: '2',
    type: 'add',
    remarks: 'Trip payment received',
    created_at: '2024-01-20T10:30:00Z',
    updated_at: '2024-01-20T10:30:00Z',
  },
  {
    id: '2',
    status: 'pending',
    balance_before: 1250.50,
    balance_after: 1100.50,
    amount: 150.00,
    wallet: '1',
    user: '2',
    type: 'deducted',
    remarks: 'Fuel expense',
    created_at: '2024-01-21T14:00:00Z',
    updated_at: '2024-01-21T14:00:00Z',
  },
];

// Mock Settings
export let mockSettings: SuperSetting | null = {
  id: '1',
  per_km_charge: 2.50,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock Places
export const mockPlaces: Place[] = [
  {
    id: '1',
    name: 'Central Bus Station',
    code: 'CBS',
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Main Street, New York, NY 10001',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Airport Terminal',
    code: 'APT',
    latitude: 40.6413,
    longitude: -73.7781,
    address: 'JFK Airport, Queens, NY 11430',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    name: 'Downtown Hub',
    code: 'DTH',
    latitude: 40.7580,
    longitude: -73.9855,
    address: 'Times Square, New York, NY 10036',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
  {
    id: '4',
    name: 'Brooklyn Terminal',
    code: 'BKT',
    latitude: 40.6892,
    longitude: -73.9442,
    address: '450 Flatbush Ave, Brooklyn, NY 11225',
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
  },
];

// Mock Route Stop Points
export const mockRouteStopPoints: RouteStopPoint[] = [
  { id: '1', route: '1', place: '3', order: 1, created_at: '2024-01-05T00:00:00Z', updated_at: '2024-01-05T00:00:00Z' },
  { id: '2', route: '1', place: '4', order: 2, created_at: '2024-01-05T00:00:00Z', updated_at: '2024-01-05T00:00:00Z' },
];

// Mock Routes
export const mockRoutes: Route[] = [
  {
    id: '1',
    name: 'City to Airport Express',
    is_bidirectional: true,
    start_point: '1',
    end_point: '2',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
  },
  {
    id: '2',
    name: 'Downtown Shuttle',
    is_bidirectional: false,
    start_point: '1',
    end_point: '3',
    created_at: '2024-01-06T00:00:00Z',
    updated_at: '2024-01-06T00:00:00Z',
  },
];

// Mock Vehicle Seats
export const mockVehicleSeats: VehicleSeat[] = [
  { id: '1', vehicle: '1', side: 'A', number: 1, status: 'available', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: '2', vehicle: '1', side: 'A', number: 2, status: 'booked', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: '3', vehicle: '1', side: 'A', number: 3, status: 'available', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: '4', vehicle: '1', side: 'A', number: 4, status: 'available', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: '5', vehicle: '1', side: 'B', number: 1, status: 'booked', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: '6', vehicle: '1', side: 'B', number: 2, status: 'available', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: '7', vehicle: '1', side: 'B', number: 3, status: 'booked', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: '8', vehicle: '1', side: 'B', number: 4, status: 'available', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: '9', vehicle: '1', side: 'C', number: 1, status: 'available', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
];

// Mock Vehicle Images
export const mockVehicleImages: VehicleImage[] = [
  {
    id: '1',
    vehicle: '1',
    title: 'Front View',
    description: 'Vehicle front exterior',
    image: '/placeholder.svg',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
];

// Mock Vehicles
export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    imei: '123456789012345',
    name: 'Express Bus 001',
    vehicle_no: 'NYC-1234',
    vehicle_type: 'Bus',
    odometer: 45000,
    overspeed_limit: 80,
    description: 'Modern express bus with AC and WiFi',
    drivers: ['2', '3'],
    active_driver: '2',
    routes: ['1', '2'],
    active_route: '1',
    is_active: true,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  {
    id: '2',
    imei: '987654321098765',
    name: 'City Shuttle 002',
    vehicle_no: 'NYC-5678',
    vehicle_type: 'Minibus',
    odometer: 32000,
    overspeed_limit: 60,
    description: 'Compact shuttle for city routes',
    drivers: ['3'],
    routes: ['2'],
    is_active: true,
    created_at: '2024-01-12T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z',
  },
];

// Data store functions
let users = [...mockUsers];
let wallets = [...mockWallets];
let transactions = [...mockTransactions];
let settings = mockSettings;
let places = [...mockPlaces];
let routes = [...mockRoutes];
let routeStopPoints = [...mockRouteStopPoints];
let vehicles = [...mockVehicles];
let vehicleSeats = [...mockVehicleSeats];
let vehicleImages = [...mockVehicleImages];

// User CRUD
export const getUsers = () => users;
export const getUser = (id: string) => users.find(u => u.id === id);
export const createUser = (user: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
  const newUser = { ...user, id: String(Date.now()), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  users.push(newUser);
  return newUser;
};
export const updateUser = (id: string, data: Partial<User>) => {
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...data, updated_at: new Date().toISOString() };
    return users[index];
  }
  return null;
};
export const deleteUser = (id: string) => {
  users = users.filter(u => u.id !== id);
};
export const deleteUsers = (ids: string[]) => {
  users = users.filter(u => !ids.includes(u.id));
};

// Wallet CRUD
export const getWallets = () => wallets;
export const getWallet = (id: string) => wallets.find(w => w.id === id);
export const createWallet = (wallet: Omit<Wallet, 'id' | 'created_at' | 'updated_at'>) => {
  const newWallet = { ...wallet, id: String(Date.now()), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  wallets.push(newWallet);
  return newWallet;
};
export const updateWallet = (id: string, data: Partial<Wallet>) => {
  const index = wallets.findIndex(w => w.id === id);
  if (index !== -1) {
    wallets[index] = { ...wallets[index], ...data, updated_at: new Date().toISOString() };
    return wallets[index];
  }
  return null;
};
export const deleteWallet = (id: string) => {
  wallets = wallets.filter(w => w.id !== id);
};
export const deleteWallets = (ids: string[]) => {
  wallets = wallets.filter(w => !ids.includes(w.id));
};

// Transaction CRUD
export const getTransactions = () => transactions;
export const getTransaction = (id: string) => transactions.find(t => t.id === id);
export const updateTransaction = (id: string, data: Partial<Transaction>) => {
  const index = transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...data, updated_at: new Date().toISOString() };
    return transactions[index];
  }
  return null;
};
export const deleteTransaction = (id: string) => {
  transactions = transactions.filter(t => t.id !== id);
};
export const deleteTransactions = (ids: string[]) => {
  transactions = transactions.filter(t => !ids.includes(t.id));
};

// Settings CRUD
export const getSettings = () => settings;
export const createSettings = (data: Omit<SuperSetting, 'id' | 'created_at' | 'updated_at'>) => {
  settings = { ...data, id: '1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  return settings;
};
export const updateSettings = (data: Partial<SuperSetting>) => {
  if (settings) {
    settings = { ...settings, ...data, updated_at: new Date().toISOString() };
  }
  return settings;
};

// Place CRUD
export const getPlaces = () => places;
export const getPlace = (id: string) => places.find(p => p.id === id);
export const createPlace = (place: Omit<Place, 'id' | 'created_at' | 'updated_at'>) => {
  const newPlace = { ...place, id: String(Date.now()), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  places.push(newPlace);
  return newPlace;
};
export const updatePlace = (id: string, data: Partial<Place>) => {
  const index = places.findIndex(p => p.id === id);
  if (index !== -1) {
    places[index] = { ...places[index], ...data, updated_at: new Date().toISOString() };
    return places[index];
  }
  return null;
};
export const deletePlace = (id: string) => {
  places = places.filter(p => p.id !== id);
};
export const deletePlaces = (ids: string[]) => {
  places = places.filter(p => !ids.includes(p.id));
};

// Route CRUD
export const getRoutes = () => routes;
export const getRoute = (id: string) => routes.find(r => r.id === id);
export const createRoute = (route: Omit<Route, 'id' | 'created_at' | 'updated_at'>) => {
  const newRoute = { ...route, id: String(Date.now()), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  routes.push(newRoute);
  return newRoute;
};
export const updateRoute = (id: string, data: Partial<Route>) => {
  const index = routes.findIndex(r => r.id === id);
  if (index !== -1) {
    routes[index] = { ...routes[index], ...data, updated_at: new Date().toISOString() };
    return routes[index];
  }
  return null;
};
export const deleteRoute = (id: string) => {
  routes = routes.filter(r => r.id !== id);
};
export const deleteRoutes = (ids: string[]) => {
  routes = routes.filter(r => !ids.includes(r.id));
};

// Route Stop Points CRUD
export const getRouteStopPoints = (routeId?: string) => routeId ? routeStopPoints.filter(rsp => rsp.route === routeId) : routeStopPoints;
export const createRouteStopPoint = (rsp: Omit<RouteStopPoint, 'id' | 'created_at' | 'updated_at'>) => {
  const newRsp = { ...rsp, id: String(Date.now()), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  routeStopPoints.push(newRsp);
  return newRsp;
};
export const updateRouteStopPoint = (id: string, data: Partial<RouteStopPoint>) => {
  const index = routeStopPoints.findIndex(rsp => rsp.id === id);
  if (index !== -1) {
    routeStopPoints[index] = { ...routeStopPoints[index], ...data, updated_at: new Date().toISOString() };
    return routeStopPoints[index];
  }
  return null;
};
export const deleteRouteStopPoint = (id: string) => {
  routeStopPoints = routeStopPoints.filter(rsp => rsp.id !== id);
};
export const deleteRouteStopPoints = (routeId: string) => {
  routeStopPoints = routeStopPoints.filter(rsp => rsp.route !== routeId);
};

// Vehicle CRUD
export const getVehicles = () => vehicles;
export const getVehicle = (id: string) => vehicles.find(v => v.id === id);
export const createVehicle = (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
  const newVehicle = { ...vehicle, id: String(Date.now()), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  vehicles.push(newVehicle);
  return newVehicle;
};
export const updateVehicle = (id: string, data: Partial<Vehicle>) => {
  const index = vehicles.findIndex(v => v.id === id);
  if (index !== -1) {
    vehicles[index] = { ...vehicles[index], ...data, updated_at: new Date().toISOString() };
    return vehicles[index];
  }
  return null;
};
export const deleteVehicle = (id: string) => {
  vehicles = vehicles.filter(v => v.id !== id);
};
export const deleteVehicles = (ids: string[]) => {
  vehicles = vehicles.filter(v => !ids.includes(v.id));
};

// Vehicle Seat CRUD
export const getVehicleSeats = (vehicleId?: string) => vehicleId ? vehicleSeats.filter(vs => vs.vehicle === vehicleId) : vehicleSeats;
export const createVehicleSeat = (seat: Omit<VehicleSeat, 'id' | 'created_at' | 'updated_at'>) => {
  const newSeat = { ...seat, id: String(Date.now() + Math.random()), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  vehicleSeats.push(newSeat);
  return newSeat;
};
export const updateVehicleSeat = (id: string, data: Partial<VehicleSeat>) => {
  const index = vehicleSeats.findIndex(vs => vs.id === id);
  if (index !== -1) {
    vehicleSeats[index] = { ...vehicleSeats[index], ...data, updated_at: new Date().toISOString() };
    return vehicleSeats[index];
  }
  return null;
};
export const deleteVehicleSeat = (id: string) => {
  vehicleSeats = vehicleSeats.filter(vs => vs.id !== id);
};
export const deleteVehicleSeats = (vehicleId: string) => {
  vehicleSeats = vehicleSeats.filter(vs => vs.vehicle !== vehicleId);
};

// Vehicle Image CRUD
export const getVehicleImages = (vehicleId?: string) => vehicleId ? vehicleImages.filter(vi => vi.vehicle === vehicleId) : vehicleImages;
export const createVehicleImage = (image: Omit<VehicleImage, 'id' | 'created_at' | 'updated_at'>) => {
  const newImage = { ...image, id: String(Date.now() + Math.random()), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  vehicleImages.push(newImage);
  return newImage;
};
export const updateVehicleImage = (id: string, data: Partial<VehicleImage>) => {
  const index = vehicleImages.findIndex(vi => vi.id === id);
  if (index !== -1) {
    vehicleImages[index] = { ...vehicleImages[index], ...data, updated_at: new Date().toISOString() };
    return vehicleImages[index];
  }
  return null;
};
export const deleteVehicleImage = (id: string) => {
  vehicleImages = vehicleImages.filter(vi => vi.id !== id);
};
export const deleteVehicleImages = (vehicleId: string) => {
  vehicleImages = vehicleImages.filter(vi => vi.vehicle !== vehicleId);
};
