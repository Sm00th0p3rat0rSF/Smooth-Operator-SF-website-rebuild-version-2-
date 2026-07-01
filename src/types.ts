export type ServiceCategory = 'Intimate Waxing' | 'Body Waxing' | 'Face Waxing' | 'Manscaping';

export interface Service {
  id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  duration: number; // in mins
  price: number; // in USD
  bodyPartId?: string; // id representing hotspot on body map
}

export type BookingStatus = 'pending' | 'accepted' | 'declined';

export interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientBirthday?: string;
  clientAddress?: string;
  services: Service[];
  totalPrice: number;
  totalDuration: number; // include + 15 min cleaning buffer
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: BookingStatus;
  ndaSigned: boolean;
  ndaSignature: string;
  isOver18: boolean;
  skincareCheck: boolean; // confirm no facial skincare counter-indicators
  stripeCardHoldToken?: string;
  photoId?: string;
  idBypassedWithPhysicalCheck?: boolean;
  googleEventId?: string;
  ndaDriveFileId?: string;
  ndaDriveFileLink?: string;
  googleDocId?: string;
  googleDocUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Hotspot {
  id: string;
  name: string;
  gender: 'masculine' | 'feminine' | 'unisex';
  cx: number; // percentage width
  cy: number; // percentage height
  r: number; // radius
  services: string[]; // array of Service IDs
}

export interface PrepaidPackage {
  id: string;
  clientEmail: string;
  clientName: string;
  packageName: string;
  totalSessions: number;
  sessionsUsed: number;
  sessionsRemaining: number;
  lastUpdated: string;
}

