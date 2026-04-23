export type TransportMode = 'BUS' | 'METRO' | 'TRAIN' | 'TRAM' | 'SHIP';

export type DepartureState =
  | 'EXPECTED'
  | 'ATSTOP'
  | 'CANCELLED'
  | 'NOTCALLED'
  | 'NOTEXPECTED';

export type PassengerLevel =
  | 'EMPTY'
  | 'SEATS_AVAILABLE'
  | 'STANDING_PASSENGERS'
  | 'FULL'
  | 'UNKNOWN';

export interface Line {
  designation: string;
  transport_mode: TransportMode;
  /** Solid hex color used on the 2px vertical bar next to the line number. */
  color: string;
  /** Slightly lighter shade for dark mode. */
  colorDark?: string;
}

export interface Departure {
  id: string;
  /** Pre-formatted human string from SL API: "Nu", "3 min", "14:22". */
  display: string;
  scheduled: string;
  expected: string | null;
  state: DepartureState;
  destination: string;
  direction?: string;
  via?: string;
  line: Line;
  hasDeviation?: boolean;
  passengerLevel?: PassengerLevel;
}

export interface Stop {
  id: number;
  name: string;
  /** Distance from user in meters. */
  distance?: number;
  /** Number of platforms / stop points at this site. */
  platforms?: number;
  isFavorite?: boolean;
}
