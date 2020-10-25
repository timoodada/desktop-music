const http = require('http');
const https = require('https');
const url = require('url');
const qs = require('querystring');
const zlib = require('zlib');
const { app, BrowserWindow } = require('electron');

const buildQuery = (parsedUrl, params) => {
  const merged = Object.assign(qs.parse(parsedUrl.query), params);
  return qs.stringify(merged);
};

exports.request = (config, successFn, errorFn) => {
  let end = false;
  const parsedUrl = url.parse(config.url);
  const req = (parsedUrl.protocol === 'https:' ? https : http).request({
    headers: config.headers,
    hostname: parsedUrl.hostname,
    method: config.method,
    path: parsedUrl.pathname + '?' + buildQuery(parsedUrl, config.params || {}),
    port: parsedUrl.port,
    protocol: parsedUrl.protocol,
    timeout: config.timeout || 20000
  }, (response) => {
    const resHeaders = response.headers;
    let res = response;
    if (resHeaders['content-encoding'] === 'gzip') {
      const unzip = zlib.createGunzip();
      res = res.pipe(unzip);
    } else {
      res.setEncoding('utf8');
    }
    let data = '';
    res.on('data', chunk => {
      data += chunk;
    });
    res.on('end', () => {
      end = true;
      successFn(data);
    });
  });
  req.on('error', error => {
    errorFn(error);
  });
  req.on('abort', () => {
    if (end) { return; }
    errorFn(new Error('Abort'));
  });
  req.on('timeout', () => {
    errorFn(new Error('Timeout'));
  });
  if (config.data) {
    const postData = typeof config.data === 'string' ? config.data : qs.stringify(config.data);
    req.setHeader('Content-Length', Buffer.byteLength(postData));
    req.write(postData);
  }
  req.end();
  return () => {
    req.abort();
  };
};

exports.login = async () => {
  await app.whenReady();
  const win = new BrowserWindow({
    width: 500,
    height: 500
  });
  await win.loadURL('https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=100497308&redirect_uri=https%3A%2F%2Fy.qq.com%2Fportal%2Fwx_redirect.html%3Flogin_type%3D1%26surl%3Dhttps%253A%252F%252Fy.qq.com%252Fportal%252Fprofile.html%2523sub%253Dother%2526tab%253Dcreate%2526%2526stat%253Dy_new.top.pop.logout%2526stat%253Dy_new.top.pop.logout%26use_customer_cb%3D0&state=state&display=pc');

  const getParams = () => {
    return new Promise((resolve, reject) => {
      const rets = {};
      win.webContents.session.webRequest.onCompleted((listener) => {

        if (Object.keys(rets).length >= 2) {
          return;
        }
        if (/fcgi-bin\/fcg_user_created_diss/.test(listener.url)) {
          const parsed = url.parse(listener.url);
          if (parsed.host === 'c.y.qq.com') {
            rets.diss = parsed;
          }
        }
        if (/\/cgi-bin\/musics\.fcg\?g_tk=/.test(listener.url)) {
          rets.loginParams = url.parse(listener.url);
        }
        if (Object.keys(rets).length >= 2) {
          resolve(rets);
        }
      });
    });
  };
  const ret = await getParams();
  const cookies = await win.webContents.session.cookies.get({
    url: 'https://c.y.qq.com'
  });

  win.close();
  return Object.assign({
    cookies
  }, ret);
};
