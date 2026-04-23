export interface Site {
  id: number
  name: string
  lat: number
  lon: number
  alias?: string[]
  valid?: boolean
}

export type TransportMode = 'BUS' | 'METRO' | 'TRAIN' | 'TRAM' | 'SHIP' | 'FERRY' | 'TAXI'

export type DepartureState =
  | 'EXPECTED'
  | 'ATSTOP'
  | 'CANCELLED'
  | 'NOTCALLED'
  | 'NOTEXPECTED'

export interface Line {
  id?: number
  designation: string
  transport_mode: TransportMode
  group_of_lines?: string | null
  transport_authority_id?: number
}

export interface StopPoint {
  id?: number
  name?: string
  designation?: string | null
}

export interface StopArea {
  id: number
  name: string
  /** BUSTERM | METROSTN | RAILWSTN | TRAMSTN | SHIPBER | FERRYBER */
  type: string
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
  via?: string
  direction: string
  direction_code?: number
  line: Line
  stop_point: StopPoint
  stop_area?: StopArea
  deviations: Deviation[]
  journey?: {
    id?: number
    state?: string
    prediction_state?: string
  }
}

export interface FavoriteSite {
  id: number
  name: string
}
