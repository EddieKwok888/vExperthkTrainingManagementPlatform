const strings = [
  "Room 101 (Persons: 10)",
  "Room A Persons: 20",
  "Room B (Persons: 5)",
  "Room C ( Persons: 15 )"
];

for (const s of strings) {
  console.log(s, "=>", s.replace(/\s*\(?\s*Persons:\s*\d+\s*\)?/gi, ''));
}
