const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/GEMINI_API_KEY=([^\s]+)/);
const apiKey = match ? match[1] : null;

if (!apiKey) {
  console.error("No API key");
  process.exit(1);
}

async function list() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    if (data.models) {
      console.log(JSON.stringify(data.models.map(m => m.name), null, 2));
    } else {
      console.error(data);
    }
  } catch(e) {
    console.error(e);
  }
}
list();
