async function testLiveAI() {
  console.log('Sending prompt to https://practicalroofems.online/api/v1/ai/generate...');
  const res = await fetch('https://practicalroofems.online/api/v1/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Draft a short 2-sentence welcome note for a new roofing employee at Practical Roof Solutions Ltd.'
    })
  });

  const data = await res.json();
  console.log('HTTP Status:', res.status);
  console.log('AI Response:', JSON.stringify(data, null, 2));
}

testLiveAI().catch(console.error);
