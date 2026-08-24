const key = 'AIzaSyDnTCGb_rLTCYcTE1NYzJSzKnauf-hDops';
async function debugKey() {
  const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  console.log('List models HTTP status:', listRes.status);
  const text = await listRes.text();
  console.log('List models response body:\n', text);
}
debugKey();
