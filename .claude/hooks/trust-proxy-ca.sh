#!/bin/bash
# Faz os navegadores dos testes (playwright-cli) confiarem no certificado da
# rede da sessão na nuvem, para o Firebase carregar. Só age quando o CA do
# proxy existe (sessões do Claude Code na web) e não desliga nenhuma
# verificação: acrescenta esse CA ao store NSS do usuário, que o Chromium lê.

CA=/root/.ccr/agent-proxy-ca.crt
NSS_DIR="$HOME/.pki/nssdb"
DB="sql:$NSS_DIR"
NAME="CCR agent proxy CA"

[ -f "$CA" ] || exit 0

if ! command -v certutil >/dev/null 2>&1; then
  command -v apt-get >/dev/null 2>&1 || exit 0
  apt-get install -y -qq libnss3-tools >/dev/null 2>&1 ||
    { apt-get update -qq >/dev/null 2>&1 && apt-get install -y -qq libnss3-tools >/dev/null 2>&1; } ||
    exit 0
fi

mkdir -p "$NSS_DIR"
[ -f "$NSS_DIR/cert9.db" ] || certutil -N -d "$DB" --empty-password >/dev/null 2>&1
# Troca a cada sessão, caso o CA tenha mudado.
certutil -D -d "$DB" -n "$NAME" >/dev/null 2>&1
certutil -A -d "$DB" -t "C,," -n "$NAME" -i "$CA" >/dev/null 2>&1
exit 0
