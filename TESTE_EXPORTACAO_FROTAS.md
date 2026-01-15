# 🧪 INSTRUÇÕES DE TESTE - EXPORTAÇÃO DE FROTAS

## ✅ Pré-requisitos

- ✓ Node.js instalado
- ✓ Servidor rodando em http://localhost:3001
- ✓ Cliente rodando em http://localhost:3000
- ✓ Frotas cadastradas no banco de dados

## 🚀 Teste 1: Teste Manual Visual

### Passos:

1. **Abra o navegador**
   ```
   http://localhost:3000
   ```

2. **Faça login** (se necessário)

3. **Vá para a aba "Acompanhamento"**
   - Procure pela aba no topo da página

4. **Role para baixo**
   - Procure pela tabela de frotas

5. **Localize os botões de exportação**
   - Procure por "📊 Exportar Excel"
   - Procure por "📄 Exportar CSV"

6. **Teste Excel**
   - Clique em "📊 Exportar Excel"
   - Verifique se o arquivo foi baixado em Downloads
   - Abra o arquivo em Excel ou Google Sheets
   - Valide se os dados aparecem corretamente

7. **Teste CSV**
   - Clique em "📄 Exportar CSV"
   - Verifique se o arquivo foi baixado em Downloads
   - Abra o arquivo em Excel ou bloco de notas
   - Valide se os dados estão separados por vírgulas

## 🔍 Teste 2: Verificação de Dados

### O que procurar no arquivo exportado:

**Coluna "Nome"** deve conter:
- Os nomes das frotas cadastradas

**Coluna "Progresso"** deve conter:
- Valores entre 0% e 100%

**Coluna "Status da Análise"** deve conter:
- NORMAL, ANORMAL ou CRITICO

**Coluna "KM Acumulado"** deve conter:
- Valores numéricos maiores ou iguais ao "KM Inicial"

## 🐛 Teste 3: Tratamento de Erros

### Teste sem frotas cadastradas:
1. Delete todas as frotas do banco
2. Clique em "Exportar Excel"
3. O arquivo deve estar vazio (com apenas cabeçalhos)
4. Não deve exibir erro na tela

### Teste com servidor desligado:
1. Desligue o servidor
2. Clique em "Exportar Excel"
3. Deve exibir erro adequado (ex: "Erro ao exportar para Excel")
4. Religue o servidor

## 💻 Teste 4: Teste de API (cURL)

### Testar rota Excel:
```bash
curl -X GET http://localhost:3001/api/frotas/export/excel \
  -H "Authorization: Bearer SEU_TOKEN" \
  --output progresso-frotas.xlsx
```

### Testar rota CSV:
```bash
curl -X GET http://localhost:3001/api/frotas/export/csv \
  -H "Authorization: Bearer SEU_TOKEN" \
  --output progresso-frotas.csv
```

## 🎯 Checklist de Validação

### Interface
- [ ] Botão "Exportar Excel" aparece
- [ ] Botão "Exportar CSV" aparece
- [ ] Botões estão na posição correta (lado direito)
- [ ] Ícones estão corretos (📊 e 📄)

### Funcionalidade
- [ ] Clique em "Exportar Excel" faz download
- [ ] Clique em "Exportar CSV" faz download
- [ ] Arquivo é nomeado com data (progresso-frotas-YYYY-MM-DD)
- [ ] Arquivo não está corrompido

### Dados
- [ ] Excel abre sem erros
- [ ] CSV abre sem erros
- [ ] Cabeçalhos estão corretos
- [ ] Dados das frotas aparecem
- [ ] Número de linhas = número de frotas + 1 (cabeçalho)

### Compatibilidade
- [ ] Excel abre em MS Excel
- [ ] Excel abre em LibreOffice
- [ ] Excel abre em Google Sheets
- [ ] CSV abre em Excel
- [ ] CSV abre em bloco de notas

## 📋 Plano de Teste Completo

### Fase 1: Funcionalidade Básica
- [ ] Teste Manual Visual (Teste 1)
- [ ] Verifique aparência dos botões

### Fase 2: Validação de Dados
- [ ] Teste de Verificação de Dados (Teste 2)
- [ ] Valide campos principais

### Fase 3: Tratamento de Erros
- [ ] Teste de Tratamento de Erros (Teste 3)
- [ ] Simule cenários de falha

### Fase 4: Integração
- [ ] Teste de API (Teste 4)
- [ ] Valide autenticação

### Fase 5: Performance
- [ ] Teste com 10 frotas
- [ ] Teste com 100 frotas
- [ ] Teste com 1000 frotas
- [ ] Medir tempo de resposta

## ✨ Casos de Teste Avançados

### 1. Múltiplos downloads em sequência
```
- Clique em Exportar Excel
- Imediatamente clique em Exportar CSV
- Ambos devem funcionar sem conflitos
```

### 2. Download com conexão lenta
```
- Simule conexão lenta (DevTools > Network Throttling)
- Clique em Exportar
- Verifique se mostra progresso
```

### 3. Dados com caracteres especiais
```
- Cadastre frota com nome contendo: ç, ã, á, é, ó, ô, etc
- Exporte em CSV
- Abra em Excel e valide caracteres
```

### 4. Valores muito grandes
```
- Cadastre frota com km acumulado > 999999
- Exporte e valide se o valor aparece corretamente
```

## 🔧 Logs para Monitorar

### Backend (servidor):
```
Procure no console por:
- Requisições GET /api/frotas/export/excel
- Requisições GET /api/frotas/export/csv
- Status 200 = sucesso
- Status 500 = erro no servidor
```

### Frontend (navegador):
```
Abra DevTools (F12) > Console e procure por:
- Mensagens de erro
- Avisos (warnings)
- Logs de sucesso
```

## 📊 Exemplo de Resultado Esperado

### Arquivo Excel:
```
┌─────────────────────────────────────────────┐
│ ID │ Nome  │ Modelo │ Progresso │ Status   │
├─────────────────────────────────────────────┤
│ 1  │ T001  │ Massey │    45.2%  │ NORMAL   │
│ 2  │ T002  │ John   │    89.5%  │ NORMAL   │
│ 3  │ C001  │ Scania │   105.0%  │ CRITICO  │
└─────────────────────────────────────────────┘
```

### Arquivo CSV:
```
ID,Nome,Modelo,Progresso,Status
1,T001,Massey,45.2%,NORMAL
2,T002,John,89.5%,NORMAL
3,C001,Scania,105.0%,CRITICO
```

## 🎓 Recomendação de Teste

**Para desenvolvimento:**
Use Teste 1 (Manual Visual) + Teste 2 (Dados)

**Para produção:**
Use todos os 4 testes + Casos Avançados

---

**Desenvolvido por Pedro Lucas - 2025**
