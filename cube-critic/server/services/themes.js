const THEMES = [
  'Tiny Dragon', 'Angry Sandwich', 'Space Potato', 'Haunted Mailbox',
  'Disco Cactus', 'Confused Robot', 'Underwater Accountant', 'Flying Donut',
  'Sad Trophy', 'Grumpy Cloud', 'Tiny House for a Giant', 'A Hat That Ate Someone',
  'Philosophical Mushroom', 'The Last Cookie', 'Speed Turtle',
  'Monster Truck for Mice', 'Invisible Elephant (but you can tell it is there)',
  'A Boat That Doubts Itself', 'Medieval Wi-Fi Tower', 'Breakfast Emergency',
  'Majestic Trash Can', 'Extremely Polite Shark', 'Future Ruins of a Pizza Place',
  'The Worlds Okayest Mountain', 'Haunted Birdfeeder', 'Sentient Filing Cabinet',
  'A Bridge to Nowhere Important', 'Very Small Volcano', 'Retired Superhero HQ',
  'Extremely Suspicious Snowman', 'A Tree That Has Seen Things',
  'The Gravity Is Negotiable Building', 'Cozy Apocalypse Shelter',
  'Bureaucratic Dragon Lair', 'Nap Architecture',
];

export function getRandomTheme() {
  return THEMES[Math.floor(Math.random() * THEMES.length)];
}

export function getAllThemes() {
  return THEMES;
}
