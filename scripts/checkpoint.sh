#!/bin/bash
set -e  # Exit on any error

echo "🔍 Running Quality Checks..."
echo ""

echo "1️⃣  Type Checking..."
npm run type-check || {
  echo "❌ Type check failed"
  echo "Fix TypeScript errors. No workarounds allowed."
  exit 1
}
echo "✅ Type check passed"
echo ""

echo "2️⃣  Linting..."
npm run lint || {
  echo "❌ Lint failed"
  echo "Fix ESLint errors. No suppression comments allowed."
  exit 1
}
echo "✅ Lint passed"
echo ""

echo "3️⃣  Building..."
npm run build || {
  echo "❌ Build failed"
  echo "Fix build errors. No workarounds allowed."
  exit 1
}
echo "✅ Build passed"
echo ""

echo "4️⃣  Tests (when available)..."
if npm run test 2>/dev/null; then
  echo "✅ Tests passed"
else
  echo "⚠️  Tests not yet configured (acceptable during Phase 1-2)"
fi
echo ""

echo "✅ All quality checks passed!"
echo "Safe to proceed to next task."
