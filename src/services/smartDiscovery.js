export function getCompatibilityScore(product, vehicle) {
  if (!vehicle) return 0;

  let score = 0;
  const fit = product.vehicleFitment || {};

  // Vehicle type (strong)
  if (fit.vehicleTypes?.includes(vehicle.type)) {
    score += 40;
  }

  // Category match
  if (fit.categories?.includes(product.category)) {
    score += 20;
  }

  // Style
  if (
    fit.styles &&
    vehicle.style &&
    fit.styles.some((s) =>
      vehicle.style.toLowerCase().includes(s.toLowerCase())
    )
  ) {
    score += 20;
  }

  // Tag-based soft match
  if (product.tags?.some((tag) => vehicle.model?.toLowerCase().includes(tag))) {
    score += 10;
  }

  return score;
}
