import type { TransportMode } from '../types'

export function getTransportColor(mode: TransportMode, groupOfLines?: string | null): string {
  switch (mode) {
    case 'BUS':   return '#d71d24'
    case 'TRAM':  return '#f36e21'
    case 'TRAIN': return '#a25ea6'
    case 'SHIP':  return '#00a0e3'
    case 'METRO': {
      const g = (groupOfLines ?? '').toLowerCase()
      if (g.includes('grön')) return '#148541'
      if (g.includes('röd')) return '#d71d24'
      if (g.includes('blå')) return '#007db8'
      return '#007db8'
    }
  }
}

export function getTransportLabel(mode: TransportMode): string {
  switch (mode) {
    case 'BUS':   return 'Buss'
    case 'METRO': return 'Tunnelbana'
    case 'TRAIN': return 'Pendeltåg'
    case 'TRAM':  return 'Spårvagn'
    case 'SHIP':  return 'Båt'
  }
}

export function getTransportEmoji(mode: TransportMode): string {
  switch (mode) {
    case 'BUS':   return '🚌'
    case 'METRO': return '🚇'
    case 'TRAIN': return '🚆'
    case 'TRAM':  return '🚊'
    case 'SHIP':  return '⛴️'
  }
}

export function formatLastUpdated(date: Date): string {
  return `Uppdaterad ${date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
}
