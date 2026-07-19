import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Shelter, Volunteer, Case, Citizen } from '../types';

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  shelters: Shelter[];
  volunteers: Volunteer[];
  cases: Case[];
  citizens: Citizen[];
  selectedCase: Case | null;
  filterType: 'all' | 'shelter' | 'hospital' | 'volunteer' | 'case';
  showWeatherOverlay: boolean;
  onMarkerClick?: (type: 'case' | 'volunteer' | 'shelter', id: string) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [40.7328, -74.0150], // Centered near Sector 7G / Neev's home
  zoom = 14,
  shelters,
  volunteers,
  cases,
  citizens,
  selectedCase,
  filterType,
  showWeatherOverlay,
  onMarkerClick
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const overlaysLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing map if any
    if (mapRef.current) {
      mapRef.current.remove();
    }

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: true,
      attributionControl: false
    });

    mapRef.current = map;

    // Use light tile layouts exclusively
    const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19
    }).addTo(map);

    // Create layer groups
    markersLayerRef.current = L.layerGroup().addTo(map);
    overlaysLayerRef.current = L.layerGroup().addTo(map);

    // Draw the River polygon
    const riverCoords: [number, number][] = [
      [40.7500, -74.0250],
      [40.7420, -74.0230],
      [40.7350, -74.0210],
      [40.7280, -74.0200],
      [40.7200, -74.0190],
      // parallel points to make a thick polygon representing river width
      [40.7200, -74.0230],
      [40.7280, -74.0240],
      [40.7350, -74.0255],
      [40.7420, -74.0270],
      [40.7500, -74.0290],
    ];

    L.polygon(riverCoords, {
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.45,
      weight: 2
    }).addTo(map).bindPopup('<b>Hudson River Branch B</b><br/>Current level: 6.85m (Critical)');

    // Draw Flood Risk Buffers (Zone A & B)
    const zoneACoords: [number, number][] = [
      [40.7500, -74.0220],
      [40.7420, -74.0200],
      [40.7350, -74.0180],
      [40.7280, -74.0170],
      [40.7200, -74.0160],
      [40.7200, -74.0230],
      [40.7500, -74.0290],
    ];

    L.polygon(zoneACoords, {
      color: '#dc2626',
      fillColor: '#ef4444',
      fillOpacity: 0.15,
      weight: 1,
      dashArray: '5, 5'
    }).addTo(map).bindPopup('<b>High Flood Risk Zone (A)</b><br/>Elevation < 3.5m');

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle updates to data markers & overlays
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    const overlaysLayer = overlaysLayerRef.current;

    if (!map || !markersLayer || !overlaysLayer) return;

    // Clear previous elements
    markersLayer.clearLayers();
    overlaysLayer.clearLayers();

    // Render weather heatmap overlay if enabled
    if (showWeatherOverlay) {
      // Draw simulated heat circles
      const heavyRainCenter: [number, number] = [40.7328, -74.0150];
      L.circle(heavyRainCenter, {
        color: '#f97316',
        fillColor: '#ea580c',
        fillOpacity: 0.25,
        radius: 1200
      }).addTo(overlaysLayer).bindPopup('<b>Rainfall Intensity Core</b><br/>Current accumulation: 48.2mm');

      const riverOverflowCenter: [number, number] = [40.7302, -74.0185];
      L.circle(riverOverflowCenter, {
        color: '#ef4444',
        fillColor: '#b91c1c',
        fillOpacity: 0.2,
        radius: 800
      }).addTo(overlaysLayer).bindPopup('<b>Critical River Surcharge Area</b>');
    }

    // Render Shelters & Hospitals
    if (filterType === 'all' || filterType === 'shelter' || filterType === 'hospital') {
      shelters.forEach(shelter => {
        if (filterType === 'hospital' && shelter.type !== 'hospital') return;
        if (filterType === 'shelter' && shelter.type === 'hospital') return;

        const isHospital = shelter.type === 'hospital';
        const color = isHospital ? '#db2777' : '#2563eb'; // pink for hospital, blue for shelter
        const iconHtml = `
          <div class="flex items-center justify-center w-9 h-9 rounded-full border-2 border-white text-white font-bold shadow-lg ${
            isHospital ? 'bg-pink-600' : 'bg-blue-600'
          }" style="transform: scale(0.95)">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              ${
                isHospital
                  ? '<path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />'
                  : '<path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />'
              }
            </svg>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-icon',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const pct = Math.round((shelter.occupied / shelter.capacity) * 100);
        const marker = L.marker([shelter.lat, shelter.lng], { icon })
          .addTo(markersLayer)
          .bindPopup(`
            <div class="p-2 text-slate-800 font-sans">
              <div class="flex items-center gap-1.5 font-bold text-sm text-blue-600">
                <span>${shelter.name}</span>
              </div>
              <p class="text-xs text-slate-500 mt-1">${shelter.address}</p>
              <div class="mt-2 text-xs">
                <div><b>Type:</b> <span class="capitalize">${shelter.type}</span></div>
                <div><b>Capacity:</b> ${shelter.occupied}/${shelter.capacity} occupied (${pct}%)</div>
                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                  <div class="h-full bg-blue-600" style="width: ${pct}%"></div>
                </div>
                <div class="mt-2 text-[10px] text-slate-400 font-mono">TEL: ${shelter.phone}</div>
              </div>
            </div>
          `);

        marker.on('click', () => {
          if (onMarkerClick) onMarkerClick('shelter', shelter.id);
        });
      });
    }

    // Render Volunteers
    if (filterType === 'all' || filterType === 'volunteer') {
      volunteers.forEach(vol => {
        if (vol.availability === 'offline') return;

        const iconHtml = `
          <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-teal-500 text-white shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
            </svg>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([vol.lat, vol.lng], { icon })
          .addTo(markersLayer)
          .bindPopup(`
            <div class="p-2 text-slate-800 font-sans">
              <div class="font-bold text-xs text-teal-600">VOLUNTEER ACTIVE</div>
              <div class="font-bold text-sm">${vol.name}</div>
              <div class="mt-1.5 text-xs">
                <div><b>Specialty:</b> ${vol.skill}</div>
                <div><b>Status:</b> ${vol.availability === 'online' ? '🟢 Online' : '🔴 Offline'}</div>
                <div><b>Current Load:</b> ${vol.currentCasesCount} active cases</div>
                <div class="mt-1 text-[10px] text-slate-400 font-mono">TEL: ${vol.phone}</div>
              </div>
            </div>
          `);

        marker.on('click', () => {
          if (onMarkerClick) onMarkerClick('volunteer', vol.id);
        });
      });
    }

    // Render Active Cases
    if (filterType === 'all' || filterType === 'case') {
      cases.forEach(c => {
        if (c.status === 'closed') return;

        const isCritical = c.priority === 'critical';
        const color = isCritical ? 'bg-red-500 ring-4 ring-red-400/30' : 'bg-yellow-500 ring-4 ring-yellow-400/30';
        const iconHtml = `
          <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white text-white font-bold shadow-lg animate-pulse ${color}">
            <span class="text-xs">!</span>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([c.lat, c.lng], { icon })
          .addTo(markersLayer)
          .bindPopup(`
            <div class="p-2 text-slate-800 font-sans w-52">
              <div class="flex justify-between items-center">
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isCritical ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }">${c.priority.toUpperCase()}</span>
                <span class="text-[9px] text-slate-400 font-mono">${c.id}</span>
              </div>
              <div class="font-bold text-sm mt-1.5">${c.citizenName}</div>
              <p class="text-[11px] text-slate-500 italic mt-1 font-serif">"${c.latestResponse}"</p>
              <div class="mt-2 text-xs">
                <div><b>Location:</b> ${c.location}</div>
                <div><b>Status:</b> <span class="capitalize text-blue-600 font-semibold">${c.status}</span></div>
                ${c.volunteerName ? `<div><b>Assigned:</b> ${c.volunteerName}</div>` : '<div><b class="text-red-500">Unassigned</b></div>'}
              </div>
            </div>
          `);

        marker.on('click', () => {
          if (onMarkerClick) onMarkerClick('case', c.id);
        });

        // Center map on selected case
        if (selectedCase && selectedCase.id === c.id) {
          map.setView([c.lat, c.lng], 15);
          marker.openPopup();
        }
      });
    }

    // Always render Primary User (Neev Sharma)
    const neev = citizens.find(cit => cit.id === 'CIT-001');
    if (neev) {
      const neevIconHtml = `
        <div class="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white bg-indigo-600 text-white shadow-xl ring-4 ring-indigo-400/20">
          <span class="text-xs font-bold font-sans">Neev</span>
        </div>
      `;
      const neevIcon = L.divIcon({
        html: neevIconHtml,
        className: 'custom-leaflet-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      L.marker([neev.lat, neev.lng], { icon: neevIcon })
        .addTo(markersLayer)
        .bindPopup(`
          <div class="p-2 text-slate-800 font-sans">
            <div class="font-bold text-indigo-600 text-xs">MY LOCATION (CITIZEN)</div>
            <div class="font-bold text-sm">${neev.name}</div>
            <div class="text-[11px] text-slate-400 mt-0.5">${neev.address}</div>
            <div class="mt-2 text-xs border-t border-slate-100 pt-1">
              <div><b>Current Risk:</b> <span class="text-orange-500 font-bold">${neev.status} (${neev.riskScore}%)</span></div>
              <div><b>Elevation:</b> ${neev.elevation}m | <b>Distance to River:</b> ${neev.distanceToRiver}m</div>
            </div>
          </div>
        `);
    }

  }, [shelters, volunteers, cases, citizens, selectedCase, filterType, showWeatherOverlay]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-inner border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Map Control HUD Overlay */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 flex flex-col gap-1.5 shadow-md pointer-events-auto">
        <div className="flex items-center gap-2 text-[10px] text-slate-700 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
          <span>River Hudson-B</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-700 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/25 border border-dashed border-red-500 inline-block"></span>
          <span>High Flood Risk Zone</span>
        </div>
        {showWeatherOverlay && (
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500/35 inline-block"></span>
            <span>Rain Core Heatmap</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default LeafletMap;
