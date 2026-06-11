import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        // (Opcional: puedes mover la config de manifest.json aquí directamente)
      }
    })
  ]
}