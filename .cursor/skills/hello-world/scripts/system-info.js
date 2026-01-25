#!/usr/bin/env node

const os = require("os");
const process = require("process");

function getSystemInfo() {
  let uptime = "N/A";
  try {
    uptime = `${Math.round(os.uptime() / 3600)} hours`;
  } catch (error) {
    uptime = "Permission denied";
  }

  const info = {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    cpuModel: os.cpus()[0]?.model || "Unknown",
    cpuCount: os.cpus().length,
    totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`,
    freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)} GB`,
    uptime: uptime,
    hostname: os.hostname(),
    cwd: process.cwd(),
    userInfo: os.userInfo().username,
  };

  return info;
}

function displaySystemInfo() {
  const info = getSystemInfo();

  console.log("\n📊 System Information\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Platform:        ${info.platform}`);
  console.log(`Architecture:    ${info.arch}`);
  console.log(`Node.js Version: ${info.nodeVersion}`);
  console.log(`CPU Model:       ${info.cpuModel}`);
  console.log(`CPU Cores:      ${info.cpuCount}`);
  console.log(`Total Memory:    ${info.totalMemory}`);
  console.log(`Free Memory:     ${info.freeMemory}`);
  console.log(`System Uptime:   ${info.uptime}`);
  console.log(`Hostname:        ${info.hostname}`);
  console.log(`Current User:    ${info.userInfo}`);
  console.log(`Working Dir:     ${info.cwd}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

displaySystemInfo();
