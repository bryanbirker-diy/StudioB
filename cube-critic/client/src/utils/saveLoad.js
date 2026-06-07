// Download the current build as a named .json file
export function saveBuildToFile(filename, theme, cubes) {
  const name = (filename || 'my-build').trim().replace(/\.json$/i, '');
  const payload = {
    cubeCriticVersion: 1,
    savedAt: new Date().toISOString(),
    theme,
    cubes,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Parse a .json file from a file input event and return { theme, cubes } or throw
export function parseBuildFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data.cubes)) throw new Error('Missing cubes array');
        resolve({ theme: data.theme || '', cubes: data.cubes });
      } catch (err) {
        reject(new Error('Invalid build file: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsText(file);
  });
}
