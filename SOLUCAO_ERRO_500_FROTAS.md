# 🔧 Solução para Erro 500 ao Listar Frotas

## Problema
O erro `GET http://localhost:3000/api/frotas 500 (Internal Server Error)` ocorre quando o banco de dados está corrompido ou incompleto, geralmente ao transferir o programa para outro PC.

## ✅ Solução Rápida

### Passo 1: Verificar o Banco de Dados
Execute o script de verificação:
```bash
node verificar-banco.js
```

Este script irá:
- Verificar se o banco existe
- Listar todas as tabelas
- Contar registros em cada tabela
- Testar a query específica de frotas

### Passo 2: Se o banco está corrompido
**Opção A - Resetar apenas os dados (recomendado):**
```bash
# No servidor (Ctrl+C para parar), depois delete o arquivo:
# Caminho do arquivo: %APPDATA%\AnaliseOleo\database.sqlite
```

**Opção B - Usar variável de ambiente:**
```bash
set ANALISEOLEO_DB_PATH=C:\Caminho\Novo\database.sqlite
npm run dev
```

### Passo 3: Verificar a saúde do servidor
Abra no navegador (enquanto o servidor está rodando):
```
http://localhost:3000/api/frotas/debug/health
```

Você deve receber uma resposta como:
```json
{
  "status": "ok",
  "message": "Banco de dados está funcionando",
  "frotasCount": 0,
  "timestamp": "2026-01-16T10:30:00.000Z"
}
```

## 📝 O que foi corrigido no código

### 1. **Melhor Tratamento de Erros** (`database.ts`)
- Adicionado try-catch na função `listWithStatus()`
- Logs detalhados de erro
- Verifica se há dados antes de processar

### 2. **Rota com Diagnóstico** (`frotaRoutes.ts`)
- Rota `GET /api/frotas` agora retorna erro descritivo
- Endpoint `GET /api/frotas/debug/health` para diagnosticar problemas
- Logs no console do servidor

### 3. **Inicialização Melhorada** (`database.ts`)
- Valida integridade do banco ao iniciar
- Verifica schema das tabelas
- Cria tabelas se não existirem

## 🆘 Se o Problema Persistir

1. **Abra o arquivo de log do servidor** e procure por erros do SQLite
2. **Delete completamente o banco:**
   - Localize: `%APPDATA%\AnaliseOleo\database.sqlite`
   - Delete o arquivo
   - Reinicie o servidor (criará novo banco automaticamente)

3. **Teste a conexão:**
   ```bash
   npm run dev
   # Espere ver: "✅ Tabelas existentes: ..."
   ```

4. **Se ainda não funcionar:**
   - Verifique se a pasta `%APPDATA%\AnaliseOleo\` tem permissão de escrita
   - Tente rodar o VS Code como Administrador

## 📞 Debug Endpoints

Enquanto o servidor está rodando, teste:

- `http://localhost:3000/api/health` - Status geral
- `http://localhost:3000/api/debug/info` - Informações do sistema
- `http://localhost:3000/api/frotas/debug/health` - Status do banco de frotas
- `http://localhost:3000/api/frotas` - Listar frotas (agora com erro melhor descrito)

## 🎯 Resumo das Mudanças

| Arquivo | Mudança |
|---------|---------|
| `server/src/database.ts` | Melhor tratamento de erro em `listWithStatus()` |
| `server/src/routes/frotaRoutes.ts` | Adicionado endpoint `/debug/health` e logs |
| `server/src/index.ts` | Adicionado endpoint `/api/debug/info` |
| `verificar-banco.js` | Novo script de diagnóstico |

---

**Última atualização:** 16 de janeiro de 2026
