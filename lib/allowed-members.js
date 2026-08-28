export const allowedMembers = [
  { name: "Izzy", group: "members", level: "Leader" },
  { name: "Lexi", group: "members", level: "Trainer" },
  { name: "Olivia", group: "members", level: "Trainer" },
  { name: "Eve", group: "members", level: "Queen" },
  { name: "Alison", group: "members", level: "Queen" },
  { name: "Hailey", group: "members", level: "Queen" },
  { name: "Elise", group: "new_members", level: "Guard" },
  { name: "Audrey", group: "new_members", level: "Noob" },
];

export const allowedNames = allowedMembers.map((member) => member.name);

export function getAllowedMember(name) {
  return allowedMembers.find((member) => member.name === name) || null;
}
