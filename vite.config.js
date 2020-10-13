const path = require('path');
const VitePluginReact = require('vite-plugin-react');

const viteConfig = ({ ...rest }) => ({
  root: path.join(__dirname, 'client'),
  alias: {
    'react': '@pika/react',
    'react-dom': '@pika/react-dom',
    'auto-bind': 'auto-bind/index',
    'crypto': 'crypto-browserify',
    'http': 'http-browserify',
    'https': 'https-browserify',
    'stream': 'stream-browserify',
  },
  jsx: 'react',
  optimizeDeps: {
    include: ['auto-bind/index', 'stylis-rule-sheet'],
  },
  // Explictly don't add the plugin resolvers because
  // we want prod React to make warnings go away
  // resolvers: [...VitePluginReact.resolvers],
  configureServer: [VitePluginReact.configureServer],
  transforms: [...VitePluginReact.transforms],
  ...rest
});

// Only for build
module.exports = viteConfig({
  outDir: path.join(__dirname, 'dist'),
  rollupInputOptions: {
    external: ['/primus/primus.js', '/snarkjs.min.js']
  },
});
module.exports.viteConfig = viteConfig;
