export async function getCityPhoto(): Promise<string | null> {
  const cities = ['new-york', 'london', 'tokyo', 'paris', 'singapore', 'berlin', 'amsterdam', 'barcelona'];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const url = `https://api.unsplash.com/photos/random?query=${city}-city-urban-transport&orientation=landscape&client_id=YOUR_UNSPLASH_ACCESS_KEY`;
  
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return data.urls?.regular || null;
    }
  } catch {}
  return null;
}

// Fallback to beautiful gradient backgrounds
export const gradientBackgrounds = [
  { colors: ['#667eea', '#764ba2'], name: 'Purple Blue' },
  { colors: ['#f093fb', '#f5576c'], name: 'Pink Red' },
  { colors: ['#4facfe', '#00f2fe'], name: 'Blue Cyan' },
  { colors: ['#43e97b', '#38f9d7'], name: 'Green Teal' },
  { colors: ['#fa709a', '#fee140'], name: 'Pink Yellow' },
  { colors: ['#a8edea', '#fed6e3'], name: 'Mint Pink' },
  { colors: ['#ff9a9e', '#fecfef'], name: 'Rose Pink' },
  { colors: ['#ffecd2', '#fcb69f'], name: 'Peach Orange' },
];
