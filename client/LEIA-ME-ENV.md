# 📝 Configuração do Arquivo .env

## ⚠️ Importante

O arquivo `.env` deve estar na **raiz do diretório `client`** (não em subpastas).

## ✅ Arquivo Correto

**Nome do arquivo:** `.env` (com o ponto no início)

**Localização:** `client/.env`

**Conteúdo:**
```
REACT_APP_API_URL=http://localhost:3001/api
```

## 🔍 Verificações

1. **Nome correto:** `.env` (não `back.env`, não `env.txt`)
2. **Localização:** Dentro da pasta `client` (mesmo nível que `package.json`)
3. **Variável:** Deve começar com `REACT_APP_`
4. **URL completa:** Incluir `/api` no final

## 🚀 Após criar/editar o arquivo

**Reinicie o servidor do frontend:**

```bash
# Pare o servidor (Ctrl+C)
# Depois inicie novamente:
cd client
npm start
```

**Importante:** O React só lê variáveis de ambiente na inicialização. Qualquer mudança no `.env` requer reiniciar o servidor.

## ❌ Erros Comuns

### ❌ `back.env`
✅ `.env`

### ❌ `VITE_API_URL=...`
✅ `REACT_APP_API_URL=...`

### ❌ `http://localhost:3001`
✅ `http://localhost:3001/api`

### ❌ Arquivo em subpasta
✅ Arquivo na raiz de `client/`

## 💡 Dica

Se ainda não funcionar após criar o `.env`:

1. Verifique se o arquivo está na raiz de `client/`
2. Verifique se o nome está correto (`.env` com ponto)
3. **Reinicie o servidor do frontend**
4. Verifique se o servidor backend está rodando na porta 3001




