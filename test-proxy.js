
const { ProxyAgent, fetch, setGlobalDispatcher } = require('undici');

async function test() {
  try {
    const proxyUrl = process.env.HTTPS_PROXY || 'http://127.0.0.1:7890';
    console.log('Using proxy:', proxyUrl);
    const agent = new ProxyAgent(proxyUrl);
    setGlobalDispatcher(agent);
    
    const res = await fetch('https://accounts.google.com/.well-known/openid-configuration');
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data keys:', Object.keys(data));
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
