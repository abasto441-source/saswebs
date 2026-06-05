const fs = require('fs');
const path = require('path');

const cachePath = path.join(process.cwd(), '.next', 'cache');

if (fs.existsSync(cachePath)) {
  console.log('Cleaning Next.js webpack cache directory to avoid Cloudflare Pages 25MB file limit...');
  fs.rmSync(cachePath, { recursive: true, force: true });
  console.log('Cache directory removed successfully.');
} else {
  console.log('No Next.js cache directory found.');
}
