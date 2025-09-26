/**
 * Realistic fare calculator for public transit in Bangalore
 * Based on BMRCL (Metro) and BMTC (Bus) fare structures
 */

export interface FareResult {
  baseFare: number;
  discount: number;
  finalFare: number;
  currency: string;
}

/**
 * Calculate Metro fare based on BMRCL slab system with 5% Smart Card discount
 * @param distanceInKm - Distance in kilometers
 * @returns FareResult with fare breakdown
 */
export function calculateMetroFare(distanceInKm: number): FareResult {
  let baseFare: number;
  
  if (distanceInKm <= 2) {
    baseFare = 10;
  } else if (distanceInKm <= 4) {
    baseFare = 20;
  } else if (distanceInKm <= 6) {
    baseFare = 30;
  } else if (distanceInKm <= 8) {
    baseFare = 40;
  } else if (distanceInKm <= 10) {
    baseFare = 50;
  } else if (distanceInKm <= 12) {
    baseFare = 60;
  } else if (distanceInKm <= 14) {
    baseFare = 70;
  } else if (distanceInKm <= 16) {
    baseFare = 80;
  } else if (distanceInKm <= 18) {
    baseFare = 90;
  } else if (distanceInKm <= 20) {
    baseFare = 100;
  } else if (distanceInKm <= 22) {
    baseFare = 110;
  } else if (distanceInKm <= 24) {
    baseFare = 120;
  } else if (distanceInKm <= 26) {
    baseFare = 130;
  } else if (distanceInKm <= 28) {
    baseFare = 140;
  } else if (distanceInKm <= 30) {
    baseFare = 150;
  } else {
    baseFare = 160; // Max fare for 30+ km
  }

  // Apply 5% Smart Card discount
  const discount = Math.round(baseFare * 0.05);
  const finalFare = baseFare - discount;

  return {
    baseFare,
    discount,
    finalFare,
    currency: 'INR'
  };
}

/**
 * Calculate BMTC bus fare based on distance with AC bus premium
 * @param distanceInKm - Distance in kilometers
 * @param isACBus - Whether it's an AC bus (higher fare)
 * @returns FareResult with fare breakdown
 */
export function calculateBMTCFare(distanceInKm: number, isACBus: boolean = false): FareResult {
  let baseFare: number;
  
  if (distanceInKm <= 3) {
    baseFare = 15;
  } else if (distanceInKm <= 6) {
    baseFare = 20;
  } else if (distanceInKm <= 10) {
    baseFare = 30;
  } else if (distanceInKm <= 15) {
    baseFare = 40;
  } else if (distanceInKm <= 20) {
    baseFare = 50;
  } else if (distanceInKm <= 25) {
    baseFare = 60;
  } else if (distanceInKm <= 30) {
    baseFare = 70;
  } else {
    baseFare = 80; // Max fare for 30+ km
  }

  // Apply AC bus premium (1.75x multiplier)
  if (isACBus) {
    baseFare = Math.round(baseFare * 1.75);
  }

  // Round to nearest ₹5 for realism
  baseFare = Math.round(baseFare / 5) * 5;

  return {
    baseFare,
    discount: 0, // No discount for bus
    finalFare: baseFare,
    currency: 'INR'
  };
}

/**
 * Calculate fare for any transport mode
 * @param mode - Transport mode (METRO, BUS, etc.)
 * @param distanceInKm - Distance in kilometers
 * @param isACBus - Whether it's an AC bus (for BUS mode only)
 * @returns FareResult with fare breakdown
 */
export function calculateFare(mode: string, distanceInKm: number, isACBus: boolean = false): FareResult {
  switch (mode.toUpperCase()) {
    case 'METRO':
    case 'BMRCL':
      return calculateMetroFare(distanceInKm);
    
    case 'BUS':
    case 'BMTC':
      return calculateBMTCFare(distanceInKm, isACBus);
    
    case 'WALK':
    case 'WALKING':
      return {
        baseFare: 0,
        discount: 0,
        finalFare: 0,
        currency: 'INR'
      };
    
    case 'CYCLE':
    case 'BIKE':
    case 'CYCLING':
      return {
        baseFare: 0,
        discount: 0,
        finalFare: 0,
        currency: 'INR'
      };
    
    case 'CAR':
    case 'RIDE_HAIL':
    case 'UBER':
    case 'OLA':
      // For ride-hailing, we'll use a base fare + per km rate
      const baseFare = 40; // Base fare
      const perKmRate = 12; // Per km rate
      const totalFare = baseFare + (distanceInKm * perKmRate);
      return {
        baseFare: Math.round(totalFare),
        discount: 0,
        finalFare: Math.round(totalFare),
        currency: 'INR'
      };
    
    default:
      // Default to 0 for unknown modes
      return {
        baseFare: 0,
        discount: 0,
        finalFare: 0,
        currency: 'INR'
      };
  }
}

/**
 * Calculate total fare for an itinerary with multiple legs
 * @param legs - Array of itinerary legs with mode and distance
 * @returns Total fare in cents
 */
export function calculateTotalFare(legs: Array<{ mode: string; distanceInKm: number; isACBus?: boolean }>): number {
  let totalFareCents = 0;
  
  for (const leg of legs) {
    const fare = calculateFare(leg.mode, leg.distanceInKm, leg.isACBus);
    totalFareCents += Math.round(fare.finalFare * 100); // Convert to cents
  }
  
  return totalFareCents;
}

/**
 * Get fare breakdown for display in UI
 * @param legs - Array of itinerary legs
 * @returns Array of fare breakdowns for each leg
 */
export function getFareBreakdown(legs: Array<{ mode: string; distanceInKm: number; isACBus?: boolean }>) {
  return legs.map(leg => {
    const fare = calculateFare(leg.mode, leg.distanceInKm, leg.isACBus);
    return {
      mode: leg.mode,
      distance: leg.distanceInKm,
      fare: fare.finalFare,
      currency: fare.currency,
      isACBus: leg.isACBus || false
    };
  });
}
