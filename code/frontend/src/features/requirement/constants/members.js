// Shared member list — replace with real API call when Auth/Member module is ready
export const MEMBERS = [
  { id: 1, initials: 'VA', name: 'Van A', isPrimary: true },
  { id: 2, initials: 'CC', name: 'Chi C', isPrimary: false },
  { id: 3, initials: 'HB', name: 'Hoang B', isPrimary: false },
  { id: 4, initials: 'TD', name: 'Tuan D', isPrimary: false },
];

export const getMemberById = (ownerId) =>
  MEMBERS.find((m) => m.id === ownerId) || null;
