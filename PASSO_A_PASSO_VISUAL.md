# 🎯 PASSO-A-PASSO VISUAL - CORRIGIR ERRO "Not Found"

## PASSO 1️⃣: Parar o Servidor

1. Vá no PowerShell onde o servidor está rodando
2. Pressione: **CTRL + C**
3. Espere aparecer: `Desejo encerrar o trabalho em lote (S/N)?`
4. Digite: **S** e pressione **ENTER**

```
│ 🚀 Servidor rodando na porta 3001
│ ... (outras linhas)
│ Desejo encerrar o trabalho em lote (S/N)? S
│ (processo finalizado)
│ ▌
```

---

## PASSO 2️⃣: Navegar para o Servidor

```powershell
cd c:\Users\usuario\Desktop\PROG\novo-projeto\server
```

A janela deve mostrar:
```
PS C:\Users\usuario\Desktop\PROG\novo-projeto\server>
```

---

## PASSO 3️⃣: Limpar Compilação Antiga

```powershell
rm -r dist
```

Pode aparecer:
```
Confirme
Deseja continuar com essa operação? [S] Sim  [T] Tudo  [N] Não  [P] Pausar  [?] Ajuda (o padrão é "N"): S
```

Digite **S** e pressione **ENTER**

---

## PASSO 4️⃣: Recompilar

```powershell
npm run build
```

Aguarde até ver:
```
> tsc

(processo finaliza sem erros)
```

---

## PASSO 5️⃣: Iniciar Servidor

```powershell
npm start
```

Procure por estas linhas:
```
💾 Usando banco local (SQLite)
🚀 Servidor rodando na porta 3001
```

✅ Se aparecer isso, está funcionando!

---

## PASSO 6️⃣: Recarregar Navegador

1. Vá em: **http://localhost:3000**
2. Pressione: **F5** (ou CTRL + SHIFT + R)
3. Aguarde carregar

---

## PASSO 7️⃣: Testar Exportação

1. Procure pelos botões de exportação
2. Clique em: **📊 Exportar Excel**
3. Aguarde

**Se funcionar:**
- ✅ Arquivo será baixado
- ✅ Sem erro

**Se não funcionar:**
- ❌ Verifique o console do servidor
- Procure por: `📊 [EXPORT EXCEL] Iniciando...`

---

## ✅ Checklist

Marque conforme for fazendo:

- [ ] Parei o servidor (CTRL + C)
- [ ] Naveguei para `server/`
- [ ] Executei `rm -r dist`
- [ ] Executei `npm run build`
- [ ] Executei `npm start`
- [ ] Vi `🚀 Servidor rodando`
- [ ] Recarreguei navegador (F5)
- [ ] Cliquei em "Exportar Excel"
- [ ] ✅ Arquivo foi baixado!

---

## 🆘 Se Algo der Errado

### Erro: "Command not found"
→ Verifique se está em `server/` (veja o caminho no terminal)

### Erro: "npm: comando não encontrado"
→ Node.js não está instalado corretamente

### Erro: Compilação falha com mensagens vermelhas
→ Pode haver erros no código TypeScript
→ Envie-me as mensagens de erro

### Servidor inicia mas botão continua com erro
→ Feche o navegador completamente
→ Abra novamente em http://localhost:3000

---

## 📊 Saída Esperada

Após `npm start`, deve ver:

```
💾 Usando banco local (SQLite)
🚀 Servidor rodando na porta 3001
```

Ao clicar em "Exportar Excel", no console deve aparecer:

```
📊 [EXPORT EXCEL] Iniciando exportação...
📊 [EXPORT EXCEL] Total de frotas: 3
📊 [EXPORT EXCEL] Arquivo gerado com 2048 bytes
✅ [EXPORT EXCEL] Exportação concluída com sucesso
```

---

**Desenvolvido por Pedro Lucas - 2025**
