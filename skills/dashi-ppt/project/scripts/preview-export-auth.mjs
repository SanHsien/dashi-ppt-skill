// 预览/导出服务器的导出请求鉴权(无副作用,便于单测)。
export function isLoopbackHost(host) {
  return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

// 导出端点会启动 headless Chromium 并写文件,需防跨站/局域网滥用:
// - 带 Origin:必须在允许列表(同源/显式允许的回环与 LAN 地址)。
// - 无 Origin 但带 Referer(浏览器顶层导航式下载,如下载 PDF/PPTX 触发的
//   `location.assign()` 不带 Origin 头):Referer 的 origin 必须在允许列表。
// - 都没有(curl/脚本):只看 TCP 连接的对端地址(req.socket.remoteAddress)必须是回环。
//   不能看 Host 头:局域网上的非浏览器客户端可以随手伪造 `Host: localhost`;也不能只看
//   服务器绑定地址:那只说明谁"够得着"服务器,不说明这个请求是谁发的。
export function isExportRequestAllowed({ origin, referer, remoteAddress, allowedOrigins }) {
  if (origin) return allowedOrigins.has(origin);
  const refererOrigin = safeOrigin(referer);
  if (refererOrigin) return allowedOrigins.has(refererOrigin);
  return isLoopbackAddress(remoteAddress);
}

// 对端 socket 地址是否为回环:127.0.0.0/8、::1,以及双栈 socket 报的 ::ffff:127.x.x.x。
export function isLoopbackAddress(address) {
  if (typeof address !== 'string') return false;
  const value = address.trim().toLowerCase();
  if (value === '::1') return true;
  const mapped = value.startsWith('::ffff:') ? value.slice('::ffff:'.length) : value;
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(mapped);
  if (!match) return false;
  const octets = match.slice(1).map(Number);
  return octets.every(octet => octet <= 255) && octets[0] === 127;
}

function safeOrigin(value) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
