/**
 * Simulert kalender-klokke for periode 2 (forbruksbasert prising).
 * Uavhengig av wall-clock — én tick tilsvarer alltid samme mengde simulert tid,
 * uansett simuleringshastighet (×1/×5/×20 endrer kun hvor fort ticks skjer i sanntid).
 */
export const SIMULATION_START = Date.UTC(2026, 5, 1) // 2026-06-01T00:00:00Z
export const MS_PER_TICK = 60 * 60 * 1000 // 1 tick = 1 simulert time

export function tickToTimestamp(tick: number): number {
  return SIMULATION_START + tick * MS_PER_TICK
}
