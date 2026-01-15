#!/bin/bash
# Script para compilar e empacotar Electron

set -e

echo "==> Compilando TypeScript do servidor..."
cd ./server
npm run build
cd ..

echo "==> Compilando cliente React..."
cd ./client
npm run build
cd ..

echo "==> Empacotando com electron-builder..."
cd ./server
npm run build:exe

echo "✅ Processo concluído! Procure pelo arquivo .exe em dist/"
