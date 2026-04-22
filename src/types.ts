export interface Site {
  id: number
  name: string
  lat: number
  lon: number
  alias?: string[]
  valid?: boolean
}

export type TransportMode = 'BUS' | 'METRO' | 'TRAIN' | 'TRAM' | 'SHIP'

export type DepartureState =
  | 'EXPECTED'
  | 'ATSTOP'
  | 'CANCELLED'
  | 'NOTCALLED'
  | 'NOTEXPECTED'

export type PassengerLevel =
  | 'EMPTY'
  | 'SEATS_AVAILABLE'
  | 'STANDING_PASSENGERS'
  | 'FULL'
  | 'UNKNOWN'

export interface Line {
  designation: string
  transport_mode: TransportMode
  group_of_lines?: string | null
}

export interface StopPoint {
  designation?: string | null
}

export interface Deviation {
  message: string
  consequence?: string
  importance_level?: number
}

export interface Departure {
  display: string
  scheduled: string
  expected: string | null
  state: DepartureState
  destination: string
  direction: string
  line: Line
  stop_point: StopPoint
  deviations: Deviation[]
  journey?: {
    id?: string
    passenger_level?: PassengerLevel
    state?: string
  }
}

export interface JourneyCall {
  stop_point?: {
    stop_area?: { name?: string }
    designation?: string
  }
  stop_area?: { name?: string }
  expected_departure?: string | null
  expected_arrival?: string | null
  state?: string
}

export interface FavoriteSite {
  id: number
  name: string
}

export interface DepartureGroup {
  key: string
  lineDesignation: string
  transportMode: TransportMode
  groupOfLines: string | null
  direction: string
  destination: string
  stopDesignation: string | null
  departures: {
    display: string
    state: DepartureState
    deviations: Deviation[]
  }[]
}
