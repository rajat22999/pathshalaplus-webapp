import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Firebase phone auth refuses to verify from `localhost` — the docs are
  // explicit: "localhost is not allowed as a hosted domain for the purposes of
  // phone auth". Development therefore has to run on a real hostname, which
  // Next then treats as a cross-origin dev request unless it is allowlisted.
  //
  // Point the hostname at this machine first:
  //   sudo sh -c 'echo "127.0.0.1 dev.pathshalaplus.com" >> /etc/hosts'
  // then browse http://dev.pathshalaplus.com:3000 instead of localhost:3000.
  allowedDevOrigins: ["dev.pathshalaplus.com"],
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
