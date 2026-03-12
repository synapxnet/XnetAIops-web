import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
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
            target: 'http://192.168.1.156:9186',
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
