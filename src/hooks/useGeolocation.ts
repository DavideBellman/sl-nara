import { useState, useEffect } from 'react'
import { getCurrentPositionPromise, type Coords } from '../lib/geo'

export type GeoStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'timeout' | 'error'

export interface GeoState {
  status: GeoStatus
  coords: Coords | null
  errorMessage: string | null
}

export function useGeolocation(): GeoState {
  const [state, setState] = useState<GeoState>({
    status: 'idle',
    coords: null,
    errorMessage: null,
  })

  useEffect(() => {
    setState(s => ({ ...s, status: 'requesting' }))

    getCurrentPositionPromise()
      .then(coords => {
        setState({ status: 'granted', coords, errorMessage: null })
      })
      .catch((err: unknown) => {
        if (err instanceof GeolocationPositionError) {
          if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
            setState({ status: 'denied', coords: null, errorMessage: 'Platsbehörighet nekad' })
          } else if (err.code === GeolocationPositionError.TIMEOUT) {
            setState({ status: 'timeout', coords: null, errorMessage: 'Timeout vid platssökning' })
          } else {
            setState({ status: 'error', coords: null, errorMessage: err.message })
          }
        } else {
          setState({
            status: 'error',
            coords: null,
            errorMessage: err instanceof Error ? err.message : 'Okänt fel',
          })
        }
      })
  }, [])

  return state
}
