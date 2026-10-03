
export default {
  basePath: '/',
  allowedHosts: [],
  supportedLocales: {
  "de": ""
},
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};
