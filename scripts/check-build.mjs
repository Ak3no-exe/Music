import { existsSync } from 'node:fs';
if (!existsSync('www/index.html')) {
  console.error('www/index.html est introuvable.');
  process.exit(1);
}
console.log('MusicBox web files OK.');
