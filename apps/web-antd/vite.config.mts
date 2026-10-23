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
            target: process.env.AIOPS_USR_DEV_URL || 'http://127.0.0.1:9185',
            ws: true,
          },
          '/clm': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/clm/, '/api/clm'),
            target: process.env.AIOPS_CLM_DEV_URL || 'http://127.0.0.1:9181',
            ws: true,
          },
          '/hom': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/hom/, '/api/hom'),
            target: process.env.AIOPS_HOM_DEV_URL || 'http://127.0.0.1:9182',
            ws: true,
          },
          '/svm': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/svm/, '/api/svm'),
            target: process.env.AIOPS_SVM_DEV_URL || 'http://127.0.0.1:9183',
            ws: true,
          },
          '/mon': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/mon/, '/api/mon'),
            target: process.env.AIOPS_MON_DEV_URL || 'http://127.0.0.1:9184',
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
            target: process.env.AIOPS_REG_DEV_URL || 'http://127.0.0.1:9187',
            ws: true,
          },
        },
      },
    },
  };
});
