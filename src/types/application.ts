
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created: Date;
}

export interface VisaApplication {
  id: string;
  customerId: string;
  customerName: string;
  type: 'UAE';
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'documents_requested' | 'documents_received' | 'in_process' | 'approved' | 'rejected';
  created: Date;
  updated: Date;
  shareableLink?: string;
  extractedData?: {
    passportNumber?: string;
    fullName?: string;
    dateOfBirth?: string;
    nationality?: string;
    panNumber?: string;
  };
}

export interface Document {
  id: string;
  applicationId: string;
  type: 'passport' | 'photo' | 'flight_ticket' | 'hotel_booking' | 'bank_statement' | 'selfie' | 'pan_card' | 'other';
  name: string;
  status: 'pending' | 'received' | 'rejected';
  url?: string;
  uploadDate?: Date;
  extractedData?: any;
}

export interface RequiredDocument {
  type: Document['type'];
  name: string;
  description: string;
  required: boolean;
}

export const UAE_REQUIRED_DOCUMENTS: RequiredDocument[] = [
  {
    type: 'passport',
    name: 'Passport Scan',
    description: 'Clear scan of passport bio page. Must be valid for at least 6 months after planned return date.',
    required: true
  },
  {
    type: 'photo',
    name: 'Passport Photo',
    description: 'Recent passport-sized photograph with white background (3.5 x 4.5 cm).',
    required: true
  },
  {
    type: 'selfie',
    name: 'Selfie Photo',
    description: 'Take a selfie with your webcam that will be automatically sized to 45mm x 45mm.',
    required: true
  },
  {
    type: 'pan_card',
    name: 'PAN Card',
    description: 'Clear scan of PAN Card (for Indian citizens only).',
    required: true
  },
  {
    type: 'flight_ticket',
    name: 'Flight Tickets',
    description: 'Confirmed return flight tickets to and from UAE.',
    required: true
  },
  {
    type: 'hotel_booking',
    name: 'Hotel Booking',
    description: 'Confirmed hotel reservations for the entire duration of stay in UAE.',
    required: true
  },
  {
    type: 'bank_statement',
    name: 'Bank Statement',
    description: 'Last 3 months bank statements showing sufficient funds for travel.',
    required: true
  }
];
