import type { Departure, Stop } from './types';

export const mockStop: Stop = {
  id: 9192,
  name: 'Slussen',
  distance: 120,
  platforms: 4,
};

export const mockDepartures: Departure[] = [
  {
    id: '1',
    display: 'Nu',
    scheduled: '2026-04-22T14:32:00',
    expected: '2026-04-22T14:32:00',
    state: 'EXPECTED',
    destination: 'Södersjukhuset',
    via: 'Kungsgatan',
    line: {
      designation: '96',
      transport_mode: 'BUS',
      color: '#d71d24',
      colorDark: '#e24b4a',
    },
  },
  {
    id: '2',
    display: '3 min',
    scheduled: '2026-04-22T14:35:00',
    expected: '2026-04-22T14:35:00',
    state: 'EXPECTED',
    destination: 'Åkeshov',
    line: {
      designation: '17',
      transport_mode: 'METRO',
      color: '#148541',
      colorDark: '#1da86a',
    },
  },
  {
    id: '3',
    display: '7 min',
    scheduled: '2026-04-22T14:39:00',
    expected: '2026-04-22T14:40:00',
    state: 'EXPECTED',
    destination: 'Norsborg',
    line: {
      designation: '13',
      transport_mode: 'METRO',
      color: '#007db8',
      colorDark: '#2b9ee0',
    },
    hasDeviation: true,
  },
  {
    id: '4',
    display: '18:04',
    scheduled: '2026-04-22T18:04:00',
    expected: null,
    state: 'CANCELLED',
    destination: 'Sofia',
    line: {
      designation: '2',
      transport_mode: 'BUS',
      color: '#d71d24',
      colorDark: '#e24b4a',
    },
  },
];

export const nearbyStops: Stop[] = [
  { id: 1, name: 'Medborgarplatsen', distance: 240 },
  { id: 2, name: 'Skanstull', distance: 450 },
  { id: 3, name: 'Södra Station', distance: 600 },
  { id: 4, name: 'Mariatorget', distance: 850 },
  { id: 5, name: 'Zinkensdamm', distance: 1100 },
  { id: 6, name: 'Gamla Stan', distance: 1800 },
];

export const favoriteStops: Stop[] = [
  { id: 1002, name: 'T-Centralen', isFavorite: true },
  { id: 1079, name: 'Odenplan', isFavorite: true },
  { id: 9192, name: 'Slussen', isFavorite: true },
];

export const recentStops: Stop[] = [
  { id: 2001, name: 'Gullmarsplan', distance: 2100 },
  { id: 2002, name: 'Tekniska högskolan', distance: 4300 },
  { id: 2003, name: 'Liljeholmen', distance: 3800 },
];
