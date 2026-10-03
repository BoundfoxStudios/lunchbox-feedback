
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  baseHref: '/',
  locale: "de",
  routes: [
  {
    "renderMode": 0,
    "route": "/"
  },
  {
    "renderMode": 0,
    "redirectTo": "/",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 688, hash: '74e8be189fedc868', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1228, hash: '749f0c794d92dc86', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)}
  },
};
