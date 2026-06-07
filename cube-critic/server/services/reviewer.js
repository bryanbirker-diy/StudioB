const TITLES = [
  'Color Goblin', 'Voxel Visionary', 'Block Whisperer', 'Cube Wizard',
  'Pixel Prophet', 'Grid Genius', 'Stackable Sage', 'The Blocky Oracle',
  'Cubist Supreme', 'Geometric Dreamer', 'The Voxel Vandal', 'Brick Bard',
  'Polygon Poet', 'The Cubic Curator', 'Master of Mayhem',
];

const OPENERS = [
  "Behold! A masterpiece crafted by someone who clearly had {adjective} intentions.",
  "After extensive analysis involving one squinted eye and a mild headache, we present this review.",
  "Sources confirm that this sculpture was built by a human who owns at least one functioning hand.",
  "Art historians are baffled. Scientists are concerned. We are impressed.",
  "This appears to have been designed by an overcaffeinated wizard on a deadline.",
  "We asked ten art critics to evaluate this work. Nine have since retired.",
  "What you see before you is either genius or a cry for help. Possibly both.",
  "This creation was clearly built with passion, or at least a vague sense of direction.",
];

const ADJECTIVES = ['noble', 'questionable', 'heroic', 'whimsical', 'chaotic', 'magnificent', 'suspicious'];

const CUBE_COMMENTS = [
  count => count < 10 ? "The minimalist approach is either profound or the builder got bored." : null,
  count => count > 200 ? "With this many cubes, we suspect the builder has something to prove." : null,
  count => count >= 10 && count <= 50 ? "A tasteful number of cubes. Neither too few nor so many we had to sit down." : null,
  count => count > 50 && count <= 200 ? "A respectable cube count that suggests genuine effort or productive procrastination." : null,
];

const HEIGHT_COMMENTS = [
  h => h >= 15 ? "The sheer ambition of building this tall suggests either architectural genius or a fear of the ground floor." : null,
  h => h <= 3 ? "Keeping things close to the earth. Humble. Grounded. Possibly unfinished." : null,
  h => h > 3 && h < 15 ? "A sensible height — neither scraping the sky nor hugging the floor awkwardly." : null,
];

const COLOR_COMMENTS = [
  c => c >= 8 ? "The color palette here suggests someone let a toddler loose in a paint factory. We love it." : null,
  c => c === 1 ? "Monochromatic. Bold. Either very intentional or the builder forgot there were other colors." : null,
  c => c >= 3 && c < 8 ? "A curated palette. The builder showed restraint, which frankly is impressive." : null,
  c => c === 2 ? "Two colors. A classic move. Binary thinking for a binary world." : null,
];

const CLOSERS = [
  "In conclusion: 10/10, would be confused by again.",
  "This sculpture has permanently altered our understanding of the theme. And possibly reality.",
  "The theme was followed with the confidence of someone who knows better than the theme.",
  "Whatever it means, it means it loudly.",
  "Future generations will study this. Or at least glance at it briefly.",
  "We award it our highest honor: the one you're about to receive.",
  "A triumph of the human spirit, or at least the human mouse-click.",
  "This will go down in history. Specifically, the local history stored in gallery.json.",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function analyzeBuild(cubes) {
  const count = cubes.length;
  const colors = new Set(cubes.map(c => c.color)).size;
  const maxY = cubes.reduce((m, c) => Math.max(m, c.position?.[1] ?? 0), 0);
  return { count, colors, maxY };
}

export function generateReview(theme, cubes) {
  const { count, colors, maxY } = analyzeBuild(cubes);

  const adj = pick(ADJECTIVES);
  const opener = pick(OPENERS).replace('{adjective}', adj);

  const cubeLine = CUBE_COMMENTS.map(fn => fn(count)).find(Boolean) || "";
  const heightLine = HEIGHT_COMMENTS.map(fn => fn(maxY)).find(Boolean) || "";
  const colorLine = COLOR_COMMENTS.map(fn => fn(colors)).find(Boolean) || "";
  const closer = pick(CLOSERS);

  const themeLine = `Themed "${theme}", this sculpture ${count === 0 ? 'contains no cubes, which is a choice' : `contains ${count} cube${count !== 1 ? 's' : ''}`}.`;

  const parts = [opener, themeLine, cubeLine, heightLine, colorLine, closer].filter(Boolean);
  const text = parts.join(' ');
  const title = pick(TITLES);

  return { title, text };
}

export function assignBadge(theme, cubes) {
  const { count, colors, maxY } = analyzeBuild(cubes);

  if (count === 0) return { name: 'The Void Sculptor', emoji: '🌑' };
  if (count > 300) return { name: 'Cubeaholic', emoji: '🧱' };
  if (colors >= 10) return { name: 'Rainbow Chaos Agent', emoji: '🌈' };
  if (maxY >= 18) return { name: 'Sky Toucher', emoji: '🏗️' };
  if (maxY <= 1 && count > 10) return { name: 'Flat Earther', emoji: '🥞' };
  if (colors === 1 && count > 20) return { name: 'Monochrome Mystic', emoji: '⬛' };
  if (count < 5) return { name: 'Minimalist Monarch', emoji: '✨' };

  const badges = [
    { name: 'Voxel Enthusiast', emoji: '🎮' },
    { name: 'Block Party Host', emoji: '🎉' },
    { name: 'Cube Connoisseur', emoji: '🎨' },
    { name: 'The Architect', emoji: '📐' },
    { name: 'Structural Visionary', emoji: '🔮' },
    { name: 'Cubist Extraordinaire', emoji: '⭐' },
  ];
  return pick(badges);
}
