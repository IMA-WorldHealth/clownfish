const process = require('process');
const os = require('os');
const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/relativeTime'));

function getSystemInfo() {
  const info = {};

  // process uptime
  const pUptime = Date.now() - (process.uptime() * 1000);
  const pUptimeAgo = dayjs().from(dayjs(pUptime), true);

  // system uptime
  const sUptime = Date.now() - (os.uptime() * 1000);
  const sUptimeAgo = dayjs().from(dayjs(sUptime), true);

  info.hostname = os.hostname();
  info.os = `${os.type()} - ${os.arch()}`;
  info.ram = (os.totalmem() / (1024 ** 3));
  info.cpus = os.cpus().length;

  info.uptime = pUptimeAgo;
  info.sysuptime = sUptimeAgo;
  info.loadavg = os.loadavg();
  info.nodeversion = process.versions.node;

  return info;
}

module.exports = getSystemInfo;
