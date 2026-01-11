export function getCompatibleParts(product, vehicle) {
  if (!product.compatibility || !vehicle) return true;

  const c = product.compatibility;

  // Make
  if (c.makes && !c.makes.includes(vehicle.make)) return false;

  // Model
  if (c.models && !c.models.includes(vehicle.model)) return false;

  // Year
  if (c.years) {
    if (vehicle.year < c.years.from) return false;
    if (c.years.to && vehicle.year > c.years.to) return false;
  }

  // Trim
  if (c.trims && !c.trims.some((t) => vehicle.trim.includes(t))) return false;

  // Engine
  if (c.engines && !c.engines.includes(vehicle.engine)) return false;

  return true;
}
