# Sistema de Análise de Frotas

Sistema para gerenciamento e análise de frotas com autenticação de usuários.

## 📋 Estrutura do Projeto

- **client/** - Aplicação React (Frontend)
- **server/** - API Node.js/TypeScript (Backend)
- **assets/** - Recursos estáticos
- **scripts/** - Scripts de build

## 🚀 Tecnologias

### Frontend
- React
- TypeScript
- CSS

### Backend
- Node.js
- TypeScript
- Express
- SQLite

## 💻 Instalação

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### Configuração

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd novo-projeto
```

2. Instale as dependências do servidor:
```bash
cd server
npm install
```

3. Instale as dependências do cliente:
```bash
cd client
npm install
```

## ▶️ Executando o Projeto

### Desenvolvimento

Você pode usar os arquivos `.bat` para iniciar rapidamente:

- `INICIAR_TUDO.bat` - Inicia servidor e cliente simultaneamente
- `INICIAR_SERVIDOR.bat` - Inicia apenas o servidor

Ou manualmente:

**Servidor:**
```bash
cd server
npm start
```

**Cliente:**
```bash
cd client
npm start
```

## 📦 Build

### Build do Cliente
```bash
cd client
npm run build
```

### Build Electron (Desktop)
Use os scripts fornecidos:
- Windows: `build-electron.ps1`
- Linux/Mac: `build-electron.sh`

## 📚 Documentação Adicional

- [Documentação de Exportação de Frotas](EXPORTAR_FROTAS.md)
- [Guia Rápido](GUIA_RAPIDO_EXPORTAR.md)
- [Solução de Erros](SOLUCAO_ERRO_404.md)

## 🔧 Scripts Úteis

Consulte [COMANDOS_RAPIDOS.md](COMANDOS_RAPIDOS.md) para uma lista de comandos úteis.

## 📄 Licença

Este projeto é proprietário.
