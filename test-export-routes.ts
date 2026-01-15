import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function testExportRoutes() {
  try {
    console.log('🧪 Testando rotas de exportação...\n');

    // Teste 1: Verificar se a rota de exportação Excel existe
    console.log('1️⃣ Testando GET /frotas/export/excel');
    try {
      const responseExcel = await axios.get(`${API_URL}/frotas/export/excel`, {
        responseType: 'arraybuffer',
      });
      console.log(`   ✅ Rota respondeu com status ${responseExcel.status}`);
      console.log(`   ✅ Content-Type: ${responseExcel.headers['content-type']}`);
      console.log(`   ✅ Tamanho do arquivo: ${responseExcel.data.byteLength} bytes\n`);
    } catch (error: any) {
      console.log(`   ❌ Erro: ${error.response?.status} - ${error.message}\n`);
    }

    // Teste 2: Verificar se a rota de exportação CSV existe
    console.log('2️⃣ Testando GET /frotas/export/csv');
    try {
      const responseCsv = await axios.get(`${API_URL}/frotas/export/csv`, {
        responseType: 'blob',
      });
      console.log(`   ✅ Rota respondeu com status ${responseCsv.status}`);
      console.log(`   ✅ Content-Type: ${responseCsv.headers['content-type']}`);
      console.log(`   ✅ Tamanho do arquivo: ${responseCsv.data.size} bytes\n`);
    } catch (error: any) {
      console.log(`   ❌ Erro: ${error.response?.status} - ${error.message}\n`);
    }

    console.log('✨ Testes concluídos!');
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testExportRoutes();
