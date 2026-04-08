export const getTierInfo = (cgpaStr: string) => {
    const cgpa = parseFloat(cgpaStr);
    if (isNaN(cgpa)) return { name: "Pass", color: "#B8C1CC" }; // Silver
    if (cgpa >= 9.0) return { name: "Distinction", color: "#D4AF37" }; // Gold
    if (cgpa >= 8.0) return { name: "Honors", color: "#1DBA8A" }; // Emerald
    if (cgpa >= 7.0) return { name: "Merit", color: "#2F6FED" }; // Blue
    if (cgpa >= 6.0) return { name: "Pass+", color: "#7A5AF8" }; // Purple
    return { name: "Pass", color: "#B8C1CC" }; // Silver
};

export const generateSVG = (university: string, degreeTitle: string, year: string, tierName: string, tierColor: string) => {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a192f"/>
      <stop offset="100%" stop-color="#020c1b"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="400" height="500" fill="url(#bgGrad)" rx="16" ry="16"/>
  <rect x="15" y="15" width="370" height="470" fill="none" stroke="${tierColor}" stroke-width="3" rx="10" ry="10" filter="url(#glow)"/>
  
  <text x="200" y="85" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2">
    ${university.toUpperCase()}
  </text>
  
  <circle cx="200" cy="170" r="45" fill="${tierColor}" fill-opacity="0.1" stroke="${tierColor}" stroke-width="2"/>
  <text x="200" y="185" font-family="Arial, sans-serif" font-size="42" fill="${tierColor}" text-anchor="middle">🎓</text>
  
  <text x="200" y="275" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">
    ${degreeTitle}
  </text>
  
  <text x="200" y="315" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#8892b0" text-anchor="middle" letter-spacing="1">
    CLASS OF ${year}
  </text>
  
  <rect x="100" y="375" width="200" height="50" fill="${tierColor}" fill-opacity="0.2" stroke="${tierColor}" stroke-width="1.5" rx="25" ry="25"/>
  <text x="200" y="407" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${tierColor}" text-anchor="middle" letter-spacing="1.5">
    ${tierName.toUpperCase()}
  </text>
  
  <text x="200" y="465" font-family="Arial, sans-serif" font-size="14" fill="#495670" text-anchor="middle" letter-spacing="1">
    VERIFIED ON ALTRIUM NETWORK
  </text>
</svg>
  `;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg.trim())))}`;
};
