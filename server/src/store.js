// In-memory store for seat bookings (temporary holds and bookings)
const trips = new Map();

function ensureTrip(id) {
  if (!trips.has(id)) {
    trips.set(id, {
      seats: new Map(),     // seat status: available, held, booked
      holds: new Map(),     // temporary holds with expiration
      bookings: new Map()   // confirmed bookings
    });
  }
  return trips.get(id);
}

export function getTripStore(id) {
  return ensureTrip(id);
}

export function getSeatStatus(trip, id) {
  return trip.seats.get(id) || 'available';
}

export function setSeatStatus(trip, id, status) {
  trip.seats.set(id, status);
}

export function getAllTrips() {
  return trips;
}

// Clean up expired holds every 5 seconds
setInterval(() => {
  const now = Date.now();
  
  for (const trip of trips.values()) {
    for (const [holdId, hold] of [...trip.holds]) {
      if (hold.expiresAt <= now) {
        // Release held seats back to available
        hold.seats.forEach(seatId => {
          if (trip.seats.get(seatId) === 'held') {
            trip.seats.set(seatId, 'available');
          }
        });
        trip.holds.delete(holdId);
      }
    }
  }
}, 5000);