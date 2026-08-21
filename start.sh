#!/usr/bin/env bash
set -euo pipefail

npm install
npm --workspace backend run migrate
npm run dev
