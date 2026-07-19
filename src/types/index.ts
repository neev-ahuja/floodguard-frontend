export interface Citizen {
  id: string;
  name: string;
  riskScore: number;
  distanceToRiver: number; // in meters
  elevation: number; // in meters above sea level
  rainfall: number; // in mm
  predictedFloodLevel: number; // in meters
  status: 'Safe' | 'Moderate' | 'High' | 'Critical';
  address: string;
  phone: string;
  email: string;
  lat: number;
  lng: number;
  medicalNotes: string;
  familyMembers: Array<{ name: string; relation: string; age: number; phone?: string }>;
  preferredComm: 'SMS' | 'WhatsApp' | 'Email' | 'Push';
  notificationPrefs: {
    weather: boolean;
    emergency: boolean;
    volunteer: boolean;
    ai: boolean;
  };
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  status: 'unread' | 'read' | 'dismissed';
  category: 'weather' | 'emergency' | 'volunteer' | 'ai' | 'case';
  actionRequired?: boolean;
}

export interface CaseTimelineEvent {
  status: 'new' | 'pending' | 'assigned' | 'enroute' | 'reached' | 'resolved' | 'closed';
  time: string;
  description: string;
}

export interface Case {
  id: string;
  citizenId: string;
  citizenName: string;
  status: 'new' | 'pending' | 'assigned' | 'enroute' | 'reached' | 'resolved' | 'closed';
  priority: 'routine' | 'monitor' | 'critical';
  location: string;
  lat: number;
  lng: number;
  createdTime: string;
  volunteerId?: string;
  volunteerName?: string;
  latestResponse: string;
  timeline: CaseTimelineEvent[];
  notes: string[];
  riskFactors: string[];
  weatherSnapshot: {
    temp: number;
    rainfall: number;
    riverLevel: number;
  };
}

export interface Volunteer {
  id: string;
  name: string;
  availability: 'online' | 'offline';
  currentCasesCount: number;
  lat: number;
  lng: number;
  skill: 'Medical' | 'Boat Rescue' | 'Food Supply' | 'General Rescue';
  phone: string;
  rating: number;
}

export interface Shelter {
  id: string;
  name: string;
  type: 'shelter' | 'hospital' | 'camp' | 'police';
  distance: number; // in miles
  capacity: number;
  occupied: number;
  status: 'open' | 'closed';
  lat: number;
  lng: number;
  phone: string;
  address: string;
}

export interface SystemLog {
  id: string;
  workflowName: string;
  status: 'success' | 'failed';
  duration: number; // in ms
  started: string;
  ended: string;
  message: string;
}

export interface WeatherData {
  temp: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  riverLevel: number;
  waterRiseTrend: 'rising' | 'falling' | 'stable';
  lastUpdated: string;
}

export interface SupabaseCitizen {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  distance_to_river?: number;
  status: 'SAFE' | 'ALERTED' | 'URGENT' | 'RESOLVED';
  risk_score: number;
  children_count: number;
  elderly_count: number;
  mobility_issues: boolean;
  cases?: any[];
}

export interface EmergencyMessage {
  id: string;
  citizen_id: number;
  sender_type: 'CITIZEN' | 'ADMIN' | 'SYSTEM';
  message: string;
  message_type: 'TEXT' | 'STATUS_UPDATE' | 'EMERGENCY_REQUEST' | 'SYSTEM_NOTIFICATION';
  created_at: string;
  read_at?: string;
  metadata?: {
    ai_classification?: {
      intent: string;
      category: string;
      urgency: string;
      cleaned: string;
    };
    admin?: string;
  };
}

export interface AuditLog {
  id: string;
  event_type: string;
  actor_type: string;
  actor_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

