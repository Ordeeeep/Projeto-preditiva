# Exportar Progresso de Frotas

## 📋 Descrição

Agora você pode exportar o progresso e acompanhamento de todas as frotas em dois formatos:
- **Excel (.xlsx)** - Com formatação profissional
- **CSV (.csv)** - Para compatibilidade com outros softwares

## 🎯 Como Usar

### Exportar para Excel
1. Clique na aba **"Acompanhamento"** (abas principais)
2. Procure pelos botões de exportação na parte superior direita da tabela
3. Clique no botão **"📊 Exportar Excel"**
4. O arquivo será baixado automaticamente com o nome: `progresso-frotas-YYYY-MM-DD.xlsx`

### Exportar para CSV
1. Siga os mesmos passos acima
2. Clique no botão **"📄 Exportar CSV"**
3. O arquivo será baixado com o nome: `progresso-frotas-YYYY-MM-DD.csv`

## 📊 Campos Inclusos na Exportação

Cada exportação contém as seguintes informações sobre as frotas:

| Campo | Descrição |
|-------|-----------|
| **ID** | Identificador único da frota |
| **Nome** | Número/Nome da frota |
| **Modelo** | Modelo do equipamento |
| **Classe** | Classe do equipamento (TRATOR, COLHEDORA, etc) |
| **Intervalo de Troca** | Intervalo em km ou horas para próxima coleta |
| **KM Inicial** | KM/Horas no momento do cadastro |
| **KM Acumulado** | Total de KM/Horas acumulados desde o cadastro |
| **Progresso** | Percentual de progresso até a próxima coleta (0-100%) |
| **KM Restante** | KM/Horas faltando até o próximo limite |
| **Próximo Limite** | KM/Horas no qual a próxima coleta deve ocorrer |
| **Status da Análise** | Status atual (NORMAL, ANORMAL, CRITICO) |
| **Data Última Análise** | Data da última análise realizada |
| **Data Criação** | Data de cadastro da frota |

## 💡 Casos de Uso

### 1. Relatório Gerencial
Exporte para Excel para criar relatórios e apresentações com os dados das frotas.

### 2. Análise de Dados
Exporte para CSV e abra em ferramentas como Power BI, Google Sheets ou R para análises avançadas.

### 3. Integração com Sistemas
Use o CSV para importar dados em outros sistemas corporativos.

### 4. Auditoria
Mantenha históricos exportando regularmente os dados.

## 🔄 Frequência de Exportação

Recomenda-se:
- **Diária**: Para monitoramento de frotas críticas
- **Semanal**: Para relatórios gerenciais
- **Mensal**: Para análises históricas e auditoria

## 📌 Notas Importantes

- Os arquivos são filtrados de acordo com a **aba de acompanhamento** (todos os dados visíveis)
- O arquivo é salvo com a data atual
- O CSV é codificado em UTF-8 com BOM (compatível com Excel em português)
- Todos os dados são ordenados por nome da frota

## 🐛 Troubleshooting

### O botão não aparece
- Verifique se você está na aba **"Acompanhamento"**
- Recarregue a página (F5)
- Verifique se há frotas cadastradas

### Arquivo baixado está vazio
- Verifique se há frotas cadastradas no sistema
- Certifique-se de que o servidor está rodando

### Arquivo Excel não abre
- Tente salvar o arquivo novamente
- Certifique-se de ter o Microsoft Excel ou compatível instalado
- Se necessário, exporte em CSV em vez de Excel

---

**Desenvolvido por Pedro Lucas - 2025**
