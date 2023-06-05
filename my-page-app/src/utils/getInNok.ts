export default function getInNok(value: number = 0): string {
  return value.toLocaleString('no-NO', {
    maximumFractionDigits: 2,
    style: 'currency',
    currency: 'NOK',
  })
}
