// Script para verificar se o servidor está rodando
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  console.log(`✅ Servidor está rodando! Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Resposta:', data);
  });
});

req.on('error', (error) => {
  console.error('❌ Servidor NÃO está rodando!');
  console.error('Erro:', error.message);
  console.log('\n💡 Execute: cd server && npm run dev');
});

req.on('timeout', () => {
  console.error('❌ Timeout - Servidor não está respondendo');
  req.destroy();
});

req.end();




