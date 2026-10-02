"use client";

import React from "react";

/**
 * AmbientBackground
 * 
 * Provides an active, perceptible live-diffusing light gradient with continuous
 * organic motion. Renders 5 luminous gradient nodes behind the UI that shift,
 * pulse, and illuminate the backdrop-blur glassmorphism panels.
 */
export function AmbientBackground() {
  return (
    <div className="ambient-diffuse-container" aria-hidden="true">
      {/* Orb 1: Brand Blue / Indigo (Top Left) */}
      <div className="ambient-diffuse-orb ambient-orb-1" />

      {/* Orb 2: Electric Violet / Purple (Top Right) */}
      <div className="ambient-diffuse-orb ambient-orb-2" />

      {/* Orb 3: Radiant Cyan / Sky (Center Floating) */}
      <div className="ambient-diffuse-orb ambient-orb-3" />

      {/* Orb 4: Rose / Magenta Warmth (Bottom Right) */}
      <div className="ambient-diffuse-orb ambient-orb-4" />

      {/* Orb 5: Emerald / Mint Accent (Bottom Left) */}
      <div className="ambient-diffuse-orb ambient-orb-5" />

      {/* Frosted Light Diffusion Sheen */}
      <div className="ambient-diffuse-overlay" />
    </div>
  );
}
