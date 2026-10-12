<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface AppItem {
  name: string
  path: string
}

const msg = ref('TEXT')
const apps = ref<AppItem[]>([])

async function addApp() {
  const path = await window.api.pickApp()
  if (!path) return

  const fileName = path.split('\\').pop()?.split('/').pop() || 'App'
  const name = fileName.replace(/\.(exe|lnk|app|bat)$/i, '')

  if (apps.value.some(a => a.path === path)) return // skip duplicates
  apps.value.push({ name, path })
}

function launch(app: AppItem) {
  window.api.launchApp(app.path)
}

onMounted(() => {
  window.api.onPythonData((data) => {
    console.log('Received in Vue:', data)
  })
})
</script>

<template>
  <div class="container">
    <h1>{{ msg }}</h1>
    <img
      src="./assets/GearNobg.png"
      alt="icon"
      width="100"
      height="100"
      class="gear"
    />

    <div class="content">
      <button @click="addApp">Add App</button>

      <div class="grid">
        <button v-for="a in apps" :key="a.path" @click="launch(a)"> 
          {{ a.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  position: relative;
  padding: 20px;
  font-family: sans-serif;
  background: rgba(0, 0, 0, 0.651);
  color: white;
  height: 100vh;
  width: 100vw;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.gear {
  position: absolute;
  left: -60px;
  top: 50%;
  transform: translateY(-50%);
}
</style>

<style>
::-webkit-scrollbar {
  display: none;
}
</style>