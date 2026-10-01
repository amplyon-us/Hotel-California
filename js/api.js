'use strict';
// All page modules use this async adapter. Later, replace these methods with fetch calls.
// sessionStorage is temporary, per-tab demo state, not authentication or a database.
HC.api = (() => {
  const key = 'hotel-california-demo-v1';
  const clone = (value) => JSON.parse(JSON.stringify(value));
  let state;
  let storageAvailable = true;
  try {
    state = JSON.parse(sessionStorage.getItem(key));
  } catch {
    storageAvailable = false;
  }
  if (!state || state.version !== 1 || state.seedDate !== HC.today() || !Array.isArray(state.rooms))
    state = HC.createDemoData();
  function persist() {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      storageAvailable = false;
    }
    if (!storageAvailable)
      HC.toast('Browser storage is unavailable. Demo changes will reset when you leave this page.');
  }
  function activity(message) {
    state.activity.push({
      actor: 'Demo user',
      message,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    });
  }
  function nextId(records, prefix, base = 1) {
    return `${prefix}${Math.max(base - 1, ...records.map((r) => Number(String(r.id).replace(prefix, '')) || 0)) + 1}`;
  }
  function reservation(id) {
    const r = state.reservations.find((item) => item.id === id);
    if (!r) throw new Error('Reservation not found.');
    return r;
  }
  function roomById(id) {
    const r = state.rooms.find((item) => item.id === Number(id));
    if (!r) throw new Error('Room not found.');
    return r;
  }
  function typeByName(name) {
    const t = state.types.find((item) => item.name === name);
    if (!t) throw new Error('Choose an existing room type.');
    return t;
  }
  function overlaps(roomId, start, end, except) {
    return state.reservations.some(
      (r) =>
        r.id !== except &&
        r.roomId === roomId &&
        ['Pending', 'Confirmed', 'Checked In'].includes(r.status) &&
        start < r.checkOut &&
        end > r.checkIn,
    );
  }
  function validateStay(room, data, except) {
    const nights = HC.nights(data.checkIn, data.checkOut);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data.checkIn || '') ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.checkOut || '') ||
      !Number.isFinite(nights) ||
      nights < 1 ||
      nights > 90 ||
      data.checkIn < HC.today()
    )
      throw new Error('Choose a future stay of 1–90 nights, with check-out after check-in.');
    const guests = Number(data.guests);
    if (!Number.isInteger(guests) || guests < 1 || guests > room.capacity)
      throw new Error(`This room accommodates 1–${room.capacity} guests.`);
    if (room.status === 'Maintenance' || overlaps(room.id, data.checkIn, data.checkOut, except))
      throw new Error(
        'This room is unavailable for those dates. Please choose another room or dates.',
      );
    return nights;
  }
  function syncRoom(roomId) {
    const room = roomById(roomId);
    if (room.status === 'Maintenance') return;
    const active = state.reservations.filter((r) => r.roomId === roomId);
    room.status = active.some((r) => r.status === 'Checked In')
      ? 'Occupied'
      : active.some(
            (r) =>
              ['Confirmed', 'Pending'].includes(r.status) &&
              r.checkIn <= HC.today() &&
              r.checkOut > HC.today(),
          )
        ? 'Reserved'
        : 'Available';
  }
  function cleanRequired(value, label, max = 120) {
    const text = String(value || '').trim();
    if (!text || text.length > max)
      throw new Error(`Enter a valid ${label.toLowerCase()} (up to ${max} characters).`);
    return text;
  }
  function positiveInteger(value, label, min, max) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < min || n > max)
      throw new Error(`${label} must be between ${min} and ${max}.`);
    return n;
  }
  function validateEmail(value) {
    const email = cleanRequired(value, 'Email', 200);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
    return email;
  }
  function assertChoice(value, choices, label) {
    if (!choices.includes(value)) throw new Error(`Choose a valid ${label}.`);
    return value;
  }
  persist();
  return {
    async loadRooms(filters = {}) {
      let rooms = clone(state.rooms);
      if (filters.checkIn && filters.checkOut)
        rooms = rooms.map((r) => ({
          ...r,
          status:
            r.status === 'Maintenance'
              ? 'Maintenance'
              : overlaps(r.id, filters.checkIn, filters.checkOut)
                ? 'Reserved'
                : 'Available',
        }));
      return rooms.filter(
        (r) =>
          (!filters.type || r.type === filters.type) &&
          (!filters.guests || r.capacity >= Number(filters.guests)) &&
          (!filters.price || r.price <= Number(filters.price)),
      );
    },
    async loadRoomTypes() {
      return clone(state.types);
    },
    async loadProfile() {
      return clone(state.customers.find((c) => c.id === 'C001'));
    },
    async loadCustomers() {
      return clone(state.customers);
    },
    async loadStaff() {
      return clone(state.staff);
    },
    async loadActivity() {
      return clone(state.activity);
    },
    async loadReservations(filters = {}) {
      return clone(
        state.reservations.filter(
          (r) =>
            (!filters.customerId || r.customerId === filters.customerId) &&
            (!filters.status || r.status === filters.status) &&
            (!filters.type || r.roomType === filters.type) &&
            (!filters.date || (r.checkIn <= filters.date && r.checkOut > filters.date)) &&
            (!filters.search ||
              `${r.id} ${r.guest}`.toLowerCase().includes(filters.search.toLowerCase())),
        ),
      );
    },
    async loadPayments(filters = {}) {
      return clone(
        state.payments.filter((p) => !filters.customerId || p.customerId === filters.customerId),
      );
    },
    async updateProfile(data) {
      const profile = state.customers.find((c) => c.id === 'C001');
      const updated = {
        name: cleanRequired(data.name, 'Full name', 80),
        email: validateEmail(data.email),
        phone: cleanRequired(data.phone, 'Phone number', 25),
      };
      Object.assign(profile, updated);
      state.reservations
        .filter((r) => r.customerId === profile.id)
        .forEach((r) => {
          r.guest = profile.name;
        });
      state.payments
        .filter((p) => p.customerId === profile.id)
        .forEach((p) => {
          p.customer = profile.name;
        });
      persist();
      return clone(profile);
    },
    async createReservation(data) {
      const room = roomById(data.roomId);
      const nights = validateStay(room, data);
      const customer = state.customers.find((c) => c.id === 'C001');
      const r = {
        id: nextId(state.reservations, 'HC-', 1001),
        customerId: customer.id,
        guest: customer.name,
        roomId: room.id,
        roomName: room.name,
        roomNumber: room.number,
        roomType: room.type,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: Number(data.guests),
        nightlyRate: room.price,
        total: nights * room.price,
        status: 'Confirmed',
        paymentStatus: 'Pending',
        requests: String(data.requests || '')
          .trim()
          .slice(0, 500),
      };
      state.reservations.push(r);
      state.payments.push({
        id: nextId(state.payments, 'PAY-', 2001),
        reservationId: r.id,
        customerId: customer.id,
        customer: customer.name,
        amount: r.total,
        method: 'Not selected',
        status: 'Pending',
        date: HC.today(),
      });
      syncRoom(room.id);
      activity(`created reservation ${r.id}.`);
      persist();
      return clone(r);
    },
    async updateReservation(id, data) {
      const r = reservation(id);
      if (!['Pending', 'Confirmed'].includes(r.status))
        throw new Error('Only pending or confirmed reservations can be edited.');
      const nights = validateStay(roomById(r.roomId), data, r.id);
      const total = nights * r.nightlyRate;
      assertChoice(data.status, ['Pending', 'Confirmed'], 'reservation status');
      if (r.paymentStatus === 'Paid' && total !== r.total)
        throw new Error('This stay is already paid. Keep the same number of nights in this demo.');
      Object.assign(r, {
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: Number(data.guests),
        status: data.status,
        total,
      });
      const p = state.payments.find((item) => item.reservationId === id);
      if (p) p.amount = total;
      syncRoom(r.roomId);
      activity(`updated reservation ${id}.`);
      persist();
      return clone(r);
    },
    async cancelReservation(id) {
      const r = reservation(id);
      if (!['Pending', 'Confirmed'].includes(r.status))
        throw new Error('This reservation can no longer be cancelled.');
      r.status = 'Cancelled';
      const p = state.payments.find((item) => item.reservationId === id);
      if (p?.status === 'Paid') {
        p.status = 'Refunded';
        r.paymentStatus = 'Refunded';
      } else {
        state.payments = state.payments.filter((item) => item.reservationId !== id);
        r.paymentStatus = 'Cancelled';
      }
      syncRoom(r.roomId);
      activity(`cancelled reservation ${id}.`);
      persist();
    },
    async payReservation(id, method, collectedAtHotel = false) {
      const r = reservation(id);
      if (['Cancelled', 'Completed'].includes(r.status))
        throw new Error('This reservation cannot accept a payment.');
      assertChoice(method, ['Card', 'Digital Wallet', 'Pay at Hotel'], 'payment method');
      let p = state.payments.find((item) => item.reservationId === id);
      if (p?.status === 'Paid') throw new Error('This reservation is already paid.');
      if (!p) {
        p = {
          id: nextId(state.payments, 'PAY-', 2001),
          reservationId: id,
          customerId: r.customerId,
          customer: r.guest,
          amount: r.total,
        };
        state.payments.push(p);
      }
      p.method = method;
      p.status = method === 'Pay at Hotel' && !collectedAtHotel ? 'Pending' : 'Paid';
      p.date = HC.today();
      r.paymentStatus = p.status;
      activity(`recorded ${p.status.toLowerCase()} payment for ${id}.`);
      persist();
      return clone(p);
    },
    async transitionStay(id, status) {
      const r = reservation(id);
      const room = roomById(r.roomId);
      if (status === 'Checked In') {
        if (r.status !== 'Confirmed' || r.checkIn > HC.today() || r.checkOut <= HC.today())
          throw new Error(
            'Only a confirmed stay within its arrival and departure dates can check in.',
          );
        if (
          room.status === 'Maintenance' ||
          state.reservations.some(
            (other) => other.id !== id && other.roomId === room.id && other.status === 'Checked In',
          )
        )
          throw new Error('This room is not ready for check-in.');
      } else if (status === 'Completed') {
        if (r.status !== 'Checked In')
          throw new Error('The guest must be checked in before checkout.');
        if (r.paymentStatus !== 'Paid') throw new Error('Record a demo payment before checkout.');
      } else throw new Error('Invalid stay transition.');
      r.status = status;
      syncRoom(r.roomId);
      activity(`${status === 'Completed' ? 'checked out' : 'checked in'} ${r.guest} (${id}).`);
      persist();
    },
    async saveRoom(id, data) {
      const number = cleanRequired(data.number, 'Room number', 10);
      if (
        state.rooms.some(
          (r) => r.number.toLowerCase() === number.toLowerCase() && r.id !== Number(id),
        )
      )
        throw new Error('That room number is already in use.');
      const type = typeByName(data.type);
      const floor = positiveInteger(data.floor, 'Floor', 0, 99);
      const status = assertChoice(
        data.status,
        ['Available', 'Reserved', 'Occupied', 'Maintenance'],
        'room status',
      );
      let room = id ? roomById(id) : null;
      if (
        room &&
        state.reservations.some(
          (r) => r.roomId === room.id && ['Confirmed', 'Pending', 'Checked In'].includes(r.status),
        )
      ) {
        if (room.type !== type.name || room.status !== status || room.number !== number)
          throw new Error(
            'This room has active reservations. Manage those stays before changing its type, number, or status.',
          );
      }
      if (!room) {
        room = {
          id: Math.max(0, ...state.rooms.map((r) => r.id)) + 1,
          name: `${type.name} Room ${number}`,
          image:
            type.name === 'Private Villa'
              ? 'assets/images/rooms/villa.jpg'
              : 'assets/images/rooms/deluxe.jpg',
          amenities: ['Wi-Fi', 'Daily housekeeping'],
        };
        state.rooms.push(room);
      }
      Object.assign(room, {
        number,
        type: type.name,
        floor,
        status,
        price: type.price,
        capacity: type.capacity,
        beds: type.beds,
        description: type.description,
      });
      activity(`saved room ${number}.`);
      persist();
      return clone(room);
    },
    async deleteRoom(id) {
      const room = roomById(id);
      if (state.reservations.some((r) => r.roomId === room.id))
        throw new Error('This room is referenced by reservation history and cannot be deleted.');
      state.rooms = state.rooms.filter((r) => r.id !== room.id);
      activity(`deleted room ${room.number}.`);
      persist();
    },
    async saveRoomType(id, data) {
      const name = cleanRequired(data.name, 'Room type', 50);
      const price = positiveInteger(data.price, 'Price', 1, 10000);
      const capacity = positiveInteger(data.capacity, 'Capacity', 1, 6);
      const beds = cleanRequired(data.beds, 'Beds', 60);
      const description = cleanRequired(data.description, 'Description', 250);
      if (state.types.some((t) => t.name.toLowerCase() === name.toLowerCase() && t.id !== id))
        throw new Error('A room type with that name already exists.');
      let type = state.types.find((t) => t.id === id);
      const previousName = type?.name;
      const linkedRooms = state.rooms.filter((r) => r.type === previousName);
      if (
        state.reservations.some(
          (r) =>
            linkedRooms.some((room) => room.id === r.roomId) &&
            ['Pending', 'Confirmed', 'Checked In'].includes(r.status) &&
            r.guests > capacity,
        )
      )
        throw new Error('The new capacity is too small for an active reservation.');
      if (!type) {
        type = { id: nextId(state.types, 'T', 1) };
        state.types.push(type);
      }
      Object.assign(type, { name, price, capacity, beds, description });
      linkedRooms.forEach((room) =>
        Object.assign(room, { type: name, price, capacity, beds, description }),
      );
      activity(`updated the ${name} room type.`);
      persist();
      return clone(type);
    },
    async deleteRoomType(id) {
      const type = state.types.find((t) => t.id === id);
      if (!type) throw new Error('Room type not found.');
      if (
        state.rooms.some((r) => r.type === type.name) ||
        state.reservations.some((r) => r.roomType === type.name)
      )
        throw new Error('This type is in use by rooms or reservations and cannot be deleted.');
      state.types = state.types.filter((t) => t.id !== id);
      persist();
    },
    async saveStaff(id, data) {
      const name = cleanRequired(data.name, 'Name', 80);
      const email = validateEmail(data.email);
      const phone = cleanRequired(data.phone, 'Phone', 25);
      const role = assertChoice(data.role, ['Receptionist', 'Manager', 'Admin'], 'role');
      const status = assertChoice(data.status, ['Active', 'Inactive'], 'staff status');
      if (state.staff.some((s) => s.email.toLowerCase() === email.toLowerCase() && s.id !== id))
        throw new Error('A staff member with that email already exists.');
      let person = state.staff.find((s) => s.id === id);
      if (!person) {
        person = { id: nextId(state.staff, 'S', 1) };
        state.staff.push(person);
      }
      Object.assign(person, { name, email, phone, role, status });
      activity(`saved staff member ${name}.`);
      persist();
      return clone(person);
    },
    async deleteStaff(id) {
      state.staff = state.staff.filter((s) => s.id !== id);
      activity(`removed staff record ${id}.`);
      persist();
    },
    async resetDemo() {
      state = HC.createDemoData();
      persist();
    },
  };
})();
