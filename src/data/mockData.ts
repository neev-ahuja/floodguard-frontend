import type { Citizen, Alert, Case, Volunteer, Shelter, SystemLog, WeatherData } from '../types';

export const initialWeatherData: WeatherData = {
  temp: 23.4,
  humidity: 92,
  rainfall: 48.2, // mm in last 24h
  windSpeed: 28.4, // mph
  riverLevel: 6.85, // meters (critical threshold is 6.5m)
  waterRiseTrend: 'rising',
  lastUpdated: '13:05:00 UTC',
  city: 'Chennai',
  alertStatus: 'CRITICAL_FLOOD_RISK',
  isFloodRisk: true,
  severity: 'HIGH',
  alertMessage: 'CRITICAL: Severe thunderstorm and heavy rainfall expected. Localized flooding and road inundation are likely.',
  recommendedActions: [
    'Avoid waterlogged roads and low-lying areas',
    'Ensure drainage outlets around property are clear',
    'Keep emergency devices fully charged'
  ]
};

export const initialCitizens: Citizen[] = [
  {
    id: 'CIT-001',
    name: 'Neev Sharma',
    riskScore: 78,
    distanceToRiver: 120,
    elevation: 4.2,
    rainfall: 52.4,
    predictedFloodLevel: 5.1,
    status: 'High',
    address: '124 Riverview Road, Sector 7G',
    phone: '+1 (555) 019-2834',
    email: 'neev.sharma@floodguard.gov',
    lat: 40.7328,
    lng: -74.0150,
    medicalNotes: 'Son (Kian) has severe asthma, requires inhaler. Spouse is diabetic.',
    familyMembers: [
      { name: 'Priya Sharma', relation: 'Spouse', age: 34, phone: '+1 (555) 019-2835' },
      { name: 'Kian Sharma', relation: 'Son', age: 8 }
    ],
    preferredComm: 'WhatsApp',
    notificationPrefs: {
      weather: true,
      emergency: true,
      volunteer: true,
      ai: true
    }
  },
  {
    id: 'CIT-002',
    name: 'Sarah Jenkins',
    riskScore: 92,
    distanceToRiver: 45,
    elevation: 2.1,
    rainfall: 64.8,
    predictedFloodLevel: 5.8,
    status: 'Critical',
    address: '12 Waterfront Drive, Sector 7G',
    phone: '+1 (555) 019-8871',
    email: 'sarah.j@netlink.com',
    lat: 40.7302,
    lng: -74.0185,
    medicalNotes: 'Mobility impaired - uses wheelchair. Requires vehicle assistance.',
    familyMembers: [],
    preferredComm: 'SMS',
    notificationPrefs: {
      weather: true,
      emergency: true,
      volunteer: true,
      ai: true
    }
  },
  {
    id: 'CIT-003',
    name: 'Marcus Vance',
    riskScore: 42,
    distanceToRiver: 450,
    elevation: 9.8,
    rainfall: 32.1,
    predictedFloodLevel: 3.2,
    status: 'Moderate',
    address: '742 Hillside Avenue, Sector 7G',
    phone: '+1 (555) 019-4402',
    email: 'marcus.vance@gmail.com',
    lat: 40.7385,
    lng: -74.0090,
    medicalNotes: 'No critical medical history.',
    familyMembers: [
      { name: 'Elena Vance', relation: 'Daughter', age: 14 }
    ],
    preferredComm: 'Push',
    notificationPrefs: {
      weather: true,
      emergency: true,
      volunteer: false,
      ai: false
    }
  },
  {
    id: 'CIT-004',
    name: 'Amina Khatri',
    riskScore: 84,
    distanceToRiver: 85,
    elevation: 3.5,
    rainfall: 58.0,
    predictedFloodLevel: 5.4,
    status: 'High',
    address: '38 Low-Basin Lane, Sector 7G',
    phone: '+1 (555) 019-1122',
    email: 'amina.k@urban.org',
    lat: 40.7289,
    lng: -74.0125,
    medicalNotes: 'Elderly resident, lives alone. Requires check-in.',
    familyMembers: [],
    preferredComm: 'SMS',
    notificationPrefs: {
      weather: true,
      emergency: true,
      volunteer: true,
      ai: true
    }
  },
  {
    id: 'CIT-005',
    name: 'David Miller',
    riskScore: 15,
    distanceToRiver: 980,
    elevation: 18.5,
    rainfall: 18.5,
    predictedFloodLevel: 1.5,
    status: 'Safe',
    address: '109 Crestview Heights, Sector 7G',
    phone: '+1 (555) 019-5566',
    email: 'dmiller@crest.net',
    lat: 40.7450,
    lng: -73.9980,
    medicalNotes: 'None.',
    familyMembers: [
      { name: 'Linda Miller', relation: 'Spouse', age: 52 },
      { name: 'Jake Miller', relation: 'Son', age: 19 }
    ],
    preferredComm: 'Email',
    notificationPrefs: {
      weather: false,
      emergency: true,
      volunteer: false,
      ai: false
    }
  }
];

export const initialAlerts: Alert[] = [
  {
    id: 'ALT-101',
    severity: 'critical',
    message: 'CRITICAL ALERT: River Hudson-B level exceeded 6.5m threshold. Localized flooding imminent in low-elevation zones of Sector 7G.',
    timestamp: '12:45:10 UTC',
    status: 'unread',
    category: 'emergency',
    actionRequired: true
  },
  {
    id: 'ALT-102',
    severity: 'warning',
    message: 'WARNING: Flash flood advisory extended until 18:00 UTC due to persistent heavy rainfall (>20mm/hr forecasted).',
    timestamp: '12:15:30 UTC',
    status: 'unread',
    category: 'weather'
  },
  {
    id: 'ALT-103',
    severity: 'info',
    message: 'AI PREDICTION: Risk scores in low-basin zones raised by 15% based on combined upstream reservoir release and rainfall models.',
    timestamp: '11:50:00 UTC',
    status: 'read',
    category: 'ai'
  },
  {
    id: 'ALT-104',
    severity: 'info',
    message: 'SYSTEM UPDATE: Safe evacuation shelter at Sector 7 Community Center has reached 65% capacity. Secondary shelters now open.',
    timestamp: '11:00:15 UTC',
    status: 'dismissed',
    category: 'case'
  }
];

export const initialCases: Case[] = [
  {
    id: 'CASE-9902',
    citizenId: 'CIT-002',
    citizenName: 'Sarah Jenkins',
    status: 'assigned',
    priority: 'critical',
    location: '12 Waterfront Drive, Sector 7G',
    lat: 40.7302,
    lng: -74.0185,
    createdTime: '12:18:45 UTC',
    volunteerId: 'VOL-001',
    volunteerName: 'Aero-Med 09 (Captain Davis)',
    latestResponse: 'Need Assistance: Wheelchair bound, water rising on ground floor.',
    timeline: [
      { status: 'new', time: '12:18:45 UTC', description: 'Emergency case triggered by urgent user response.' },
      { status: 'pending', time: '12:20:00 UTC', description: 'AI agent prioritized incident as CRITICAL due to mobility constraint & proximity to river.' },
      { status: 'assigned', time: '12:24:12 UTC', description: 'Rescue unit Aero-Med 09 dispatched by dispatcher.' }
    ],
    notes: [
      'Caller confirms power is out. Water depth outside is approx 1.5 feet and rising.',
      'Unit Aero-Med 09 equipped with wheelchair elevator and basic medical support.'
    ],
    riskFactors: [
      'Distance to River: 45m',
      'Elevation: 2.1m (Critical)',
      'Mobility Impaired Resident',
      'Rainfall: 64.8mm'
    ],
    weatherSnapshot: {
      temp: 23.4,
      rainfall: 64.8,
      riverLevel: 6.85
    }
  },
  {
    id: 'CASE-9905',
    citizenId: 'CIT-004',
    citizenName: 'Amina Khatri',
    status: 'new',
    priority: 'critical',
    location: '38 Low-Basin Lane, Sector 7G',
    lat: 40.7289,
    lng: -74.0125,
    createdTime: '12:55:21 UTC',
    latestResponse: 'Evacuating: Heavy water accumulation outside. Walking is difficult.',
    timeline: [
      { status: 'new', time: '12:55:21 UTC', description: 'Case created automatically. Citizen indicated evacuating, but is an elderly resident.' }
    ],
    notes: [
      'Elderly resident lives alone. GPS tracking shows device moving very slowly.'
    ],
    riskFactors: [
      'Distance to River: 85m',
      'Elderly Resident',
      'Low Basin Topography',
      'High Current Risk score: 84'
    ],
    weatherSnapshot: {
      temp: 23.4,
      rainfall: 58.0,
      riverLevel: 6.85
    }
  },
  {
    id: 'CASE-9889',
    citizenId: 'CIT-003',
    citizenName: 'Marcus Vance',
    status: 'resolved',
    priority: 'monitor',
    location: '742 Hillside Avenue, Sector 7G',
    lat: 40.7385,
    lng: -74.0090,
    createdTime: '09:12:00 UTC',
    volunteerId: 'VOL-003',
    volunteerName: 'Responder 01 (Mark)',
    latestResponse: "I'm Safe: High elevation. Road blocked but house is completely dry.",
    timeline: [
      { status: 'new', time: '09:12:00 UTC', description: 'Case created after alert dispatch.' },
      { status: 'assigned', time: '09:20:00 UTC', description: 'Mark (Responder 01) assigned to check road conditions.' },
      { status: 'enroute', time: '09:35:00 UTC', description: 'Mark en route to Hillside Ave.' },
      { status: 'reached', time: '09:50:00 UTC', description: 'Mark reached location, confirmed citizen is safe and well stocked.' },
      { status: 'resolved', time: '10:02:10 UTC', description: 'Case resolved. Citizen confirmed dry.' }
    ],
    notes: [
      'Road blocked by minor tree debris. Local DPW notified. Resident has supplies for 72 hours.'
    ],
    riskFactors: [
      'Road Blocked Accent',
      'Elevation: 9.8m (Safe)'
    ],
    weatherSnapshot: {
      temp: 22.8,
      rainfall: 32.1,
      riverLevel: 5.92
    }
  }
];

export const initialVolunteers: Volunteer[] = [
  {
    id: 'VOL-001',
    name: 'Aero-Med 09 (Helicopter)',
    availability: 'online',
    currentCasesCount: 1,
    lat: 40.7350,
    lng: -74.0300,
    skill: 'Medical',
    phone: '+1 (555) 019-9001',
    rating: 4.9
  },
  {
    id: 'VOL-002',
    name: 'Boat Rescue Team Delta',
    availability: 'online',
    currentCasesCount: 0,
    lat: 40.7250,
    lng: -74.0150,
    skill: 'Boat Rescue',
    phone: '+1 (555) 019-9002',
    rating: 4.8
  },
  {
    id: 'VOL-003',
    name: 'Responder 01 (Mark)',
    availability: 'online',
    currentCasesCount: 0,
    lat: 40.7390,
    lng: -74.0050,
    skill: 'Food Supply',
    phone: '+1 (555) 019-9003',
    rating: 4.7
  },
  {
    id: 'VOL-004',
    name: 'Engine 44 (Fire & Pump)',
    availability: 'online',
    currentCasesCount: 0,
    lat: 40.7410,
    lng: -74.0200,
    skill: 'General Rescue',
    phone: '+1 (555) 019-9004',
    rating: 4.9
  },
  {
    id: 'VOL-005',
    name: 'Support Team Alpha',
    availability: 'offline',
    currentCasesCount: 0,
    lat: 40.7200,
    lng: -74.0000,
    skill: 'General Rescue',
    phone: '+1 (555) 019-9005',
    rating: 4.5
  }
];

export const initialShelters: Shelter[] = [
  {
    id: 'SHL-001',
    name: 'Sector 7 Community Gym',
    type: 'shelter',
    distance: 0.6,
    capacity: 200,
    occupied: 130,
    status: 'open',
    lat: 40.7345,
    lng: -74.0080,
    phone: '+1 (555) 019-7001',
    address: '500 Gym Street, Sector 7G'
  },
  {
    id: 'SHL-002',
    name: 'Mercy Medical Center',
    type: 'hospital',
    distance: 1.2,
    capacity: 100,
    occupied: 85,
    status: 'open',
    lat: 40.7412,
    lng: -74.0110,
    phone: '+1 (555) 019-7002',
    address: '10 Riverview Ave, Sector 7G'
  },
  {
    id: 'SHL-003',
    name: 'High-School Rescue Camp',
    type: 'camp',
    distance: 1.8,
    capacity: 350,
    occupied: 95,
    status: 'open',
    lat: 40.7305,
    lng: -74.0020,
    phone: '+1 (555) 019-7003',
    address: '89 Education Way, Sector 7G'
  },
  {
    id: 'SHL-004',
    name: 'Sector 7 Police HQ',
    type: 'police',
    distance: 0.9,
    capacity: 50,
    occupied: 12,
    status: 'open',
    lat: 40.7360,
    lng: -74.0130,
    phone: '+1 (555) 019-7004',
    address: '100 Protection Boulevard, Sector 7G'
  }
];

export const initialLogs: SystemLog[] = [
  {
    id: 'LOG-001',
    workflowName: 'AI Weather Ingestion Service',
    status: 'success',
    duration: 324,
    started: '13:00:00 UTC',
    ended: '13:00:00.324 UTC',
    message: 'Fetched latest meteorology radar grid. Rain intensity: 18.5 mm/hr detected at basin.'
  },
  {
    id: 'LOG-002',
    workflowName: 'River Discharge Assessment Model',
    status: 'success',
    duration: 412,
    started: '13:01:00 UTC',
    ended: '13:01:00.412 UTC',
    message: 'Calculated hydrologic forecast. Hydrograph peaked at 6.85m. Outflow gates: nominal.'
  },
  {
    id: 'LOG-003',
    workflowName: 'Citizen Risk Re-Calculation Pipeline',
    status: 'success',
    duration: 1250,
    started: '13:02:00 UTC',
    ended: '13:02:01.250 UTC',
    message: 'Scanned 14,890 citizen records. Re-calculated 42 high-risk alerts. Dispatched 2 warning SMS notifications.'
  },
  {
    id: 'LOG-004',
    workflowName: 'Emergency Alert Broadcaster',
    status: 'success',
    duration: 89,
    started: '13:05:00 UTC',
    ended: '13:05:00.089 UTC',
    message: 'Broadcasted alert ALT-101 to 489 active users in high-risk zones (radius: 500m).'
  },
  {
    id: 'LOG-005',
    workflowName: 'Emergency SMS Webhook Service',
    status: 'failed',
    duration: 5000,
    started: '13:05:01 UTC',
    ended: '13:05:06.001 UTC',
    message: 'Failed to deliver SMS payload to gateway (Error: Connection timed out). Queueing for retry...'
  }
];

export const historicalRisk = [
  { date: '10:00', riskScore: 35, rainfall: 8.2, riverLevel: 4.8 },
  { date: '11:00', riskScore: 48, rainfall: 15.4, riverLevel: 5.2 },
  { date: '12:00', riskScore: 65, rainfall: 32.1, riverLevel: 6.1 },
  { date: '13:00', riskScore: 78, rainfall: 48.2, riverLevel: 6.85 },
  { date: '14:00 (F)', riskScore: 88, rainfall: 62.0, riverLevel: 7.2 },
  { date: '15:00 (F)', riskScore: 92, rainfall: 75.0, riverLevel: 7.5 }
];
