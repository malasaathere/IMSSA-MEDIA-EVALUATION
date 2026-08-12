import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
export default (phase) => ({
  reactStrictMode: true,
  output: 'export',
  // Keep local-development assets isolated from production builds. Running
  // `next build` must never replace chunks used by an active dev server.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
});
