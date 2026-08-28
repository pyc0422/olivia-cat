export const allowedMembers = [
  { name: "Izzy", group: "members" },
  { name: "Lexi", group: "members" },
  { name: "Olivia", group: "members" },
  { name: "Eve", group: "members" },
  { name: "Alison", group: "members" },
  { name: "Hailey", group: "members" },
  { name: "Elise", group: "new_members" },
  { name: "Audrey", group: "new_members" },
];

export const allowedNames = allowedMembers.map((member) => member.name);
