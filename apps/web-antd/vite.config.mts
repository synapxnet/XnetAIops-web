import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          // 终端沿同源路径握手，保留Origin供服务端验证。Handshake on the same-origin path and preserve Origin for server verification.
          '/api/k8s/ws': {
            changeOrigin: false,
            rewrite: (path) => path.replace(/^\/api\/k8s\/ws/, '/ws'),
            target: process.env.AIOPS_K8S_DEV_URL || 'http://127.0.0.1:9186',
            ws: true,
          },
          '/usr': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/usr/, '/api/usr'),
            target: 'http://192.168.1.156:9185',
            ws: true,
          },
          '/clm': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/clm/, '/api/clm'),
            target: 'http://192.168.1.156:9181',
            ws: true,
          },
          '/hom': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/hom/, '/api/hom'),
            target: 'http://192.168.1.156:9182',
            ws: true,
          },
          '/svm': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/svm/, '/api/svm'),
            target: 'http://192.168.1.156:9183',
            ws: true,
          },
          '/mon': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/mon/, '/api/mon'),
            target: 'http://192.168.1.156:9184',
            ws: true,
          },
          '/k8s': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/k8s/, '/api/k8s'),
            target: process.env.AIOPS_K8S_DEV_URL || 'http://127.0.0.1:9186',
            ws: true,
          },
          '/reg': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/reg/, '/api/reg'),
            target: 'http://192.168.1.156:9187',
            ws: true,
          },
        },
      },
    },
  };
});
