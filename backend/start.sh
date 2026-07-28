#!/bin/sh
set -e

echo "── Running Prisma migrations ──"
npx prisma migrate deploy --schema=src/prisma/schema.prisma
echo "── Migrations complete ──"

echo "── Starting DevConnect API ──"
exec node dist/main
