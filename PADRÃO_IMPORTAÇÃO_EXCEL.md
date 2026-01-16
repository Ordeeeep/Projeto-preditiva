# Padrão de Importação de KM/Horas via Excel

## 🚗 FROTAS - Importar logs de KM

### Colunas esperadas:
- **pinacao** (ou pinação) - Nome/identificação da frota
- **rodado** (ou km rodado, km/hr) - Quilômetros rodados
- **data** - Data em formato DD/MM/YYYY

### Exemplo de arquivo Excel:

| pinacao   | data       | rodado |
|-----------|-----------|--------|
| FROTA-001 | 15/01/2026 | 1250   |
| FROTA-002 | 15/01/2026 | 850    |
| FROTA-003 | 15/01/2026 | 2100   |

### Como usar:
1. Crie um arquivo Excel com as colunas acima
2. Acesse o sistema
3. Vá em "Frotas" → "Importar Logs"
4. Selecione o arquivo
5. Clique em "Importar"

---

## ⚙️ MOTORES - Importar logs de Horas

### Colunas esperadas:
- **pinacao** - Número/identificação do motor (deve existir no sistema)
- **data** - Data em formato DD/MM/YYYY ou YYYY-MM-DD
- **rodado** - Horas rodadas (deve ser > 0)

### Exemplo de arquivo Excel:

| pinacao | data       | rodado |
|---------|-----------|--------|
| MOT-001 | 15/01/2026 | 125.5  |
| MOT-002 | 15/01/2026 | 87.2   |
| MOT-003 | 15/01/2026 | 210.8  |

### Como usar:
1. Crie um arquivo Excel com as colunas acima
2. Acesse o sistema
3. Vá em "Motores" → "Importar Horas"
4. Selecione o arquivo
5. Clique em "Importar"

---

## ⚠️ Pontos importantes:

✅ **Colunas aceitas:**
- Os nomes das colunas são case-insensitive
- Aceita variações: "km/hr", "km/hora", "kmrodado", etc.

✅ **Dados válidos:**
- Frotas/Motores devem já existir no sistema
- Data no formato DD/MM/YYYY ou YYYY-MM-DD
- KM/Horas devem ser números (inteiros ou decimais)
- **horasRodado deve ser > 0**

❌ **Erros comuns:**
- Frota/Motor não cadastrado no sistema
- Campos obrigatórios vazios
- Formato de data incorreto
- Dados não numéricos em KM/Horas
