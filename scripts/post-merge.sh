#!/bin/bash
set -e
npm ci
npx drizzle-kit push --config ./db/drizzle.config.ts
