import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	server: {
		watch: {
			ignored: ['**/.iaia/**', '**/.venv*/**', '**/backend/*.sqlite3*', '**/*.zip', '**/*.png', '**/*.svg', '**/*.pdf', '**/*.xlsx', '**/*.drawio'],
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('/node_modules/@xyflow/')) return 'graph'
					if (id.includes('/node_modules/recharts/')) return 'charts'
					if (id.includes('/node_modules/framer-motion/')) return 'motion'
					if (id.includes('/node_modules/lucide-react/')) return 'icons'
					if (id.includes('/node_modules/react-dom/') || id.includes('/node_modules/react/')) return 'react-vendor'
				},
			},
		},
	},
})