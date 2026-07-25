export function getStorageColor(used: number, total: number): string {
  const ratio = used / total
  if (ratio >= 0.9) return '#ba1a1a'
  if (ratio >= 0.75) return '#d97706'
  return '#004ac6'
}

export function getStorageHealth(used: number, total: number): { label: string; color: string } {
  const ratio = used / total
  if (ratio >= 0.95) return { label: 'Critical', color: '#ba1a1a' }
  if (ratio >= 0.85) return { label: 'Warning', color: '#d97706' }
  if (ratio >= 0.75) return { label: 'Getting full', color: '#eab308' }
  return { label: 'Good', color: '#16a34a' }
}

export function chooseBestAccount(accounts: { id: string; available_storage: number }[]): string | null {
  if (accounts.length === 0) return null
  return accounts.reduce((best, curr) =>
    curr.available_storage > best.available_storage ? curr : best
  ).id
}
