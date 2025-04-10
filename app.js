// Supabase config
const supabaseUrl = 'https://pqnpcpixhbakfgdxrkku.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbnBjcGl4aGJha2ZnZHhya2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5MzM0NTQsImV4cCI6MjA1OTUwOTQ1NH0.Z16DdMx6HuZVeJodMYXySnMvGD8d_NzS-odTLcSV14c'
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

// DOM elements
const audioPlayer = document.getElementById('audioPlayer')
const playPauseBtn = document.getElementById('playPauseBtn')
const prevBtn = document.getElementById('prevBtn')
const nextBtn = document.getElementById('nextBtn')
const uploadInput = document.getElementById('uploadInput')
const uploadBtn = document.getElementById('uploadBtn')
const trackTitle = document.getElementById('trackTitle')
const playlist = document.getElementById('playlist')
const progressBar = document.getElementById('progressBar')
const currentTimeDisplay = document.getElementById('currentTime')
const durationDisplay = document.getElementById('duration')
const playIcon = document.getElementById('playIcon')
const pauseIcon = document.getElementById('pauseIcon')
const spinningDisk = document.getElementById('spinningDisk')
const loadingIndicator = document.getElementById('loading')

let currentTrackIndex = 0
let tracks = []
let isShuffle = false
let isRepeat = false
let isRepeatPlaylist = false

// Button toggles
document.getElementById('shuffleBtn').onclick = () => toggleMode('shuffle')
document.getElementById('repeatBtn').onclick = () => toggleMode('repeat')
document.getElementById('repeatPlaylistBtn').onclick = () => toggleMode('repeatPlaylist')

function toggleMode(mode) {
  const btn = document.getElementById(`${mode}Btn`)
  switch (mode) {
    case 'shuffle': isShuffle = !isShuffle; break
    case 'repeat': isRepeat = !isRepeat; break
    case 'repeatPlaylist': isRepeatPlaylist = !isRepeatPlaylist; break
  }
  btn.classList.toggle('toggled')
}

// Format time
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// Load tracks from Supabase
async function loadTracks() {
  playlist.innerHTML = '<p class="text-white animate-pulse">Memuat daftar lagu...</p>'
  const { data, error } = await supabase.from('tracks').select('*').order('uploaded_at')
  if (error) return console.error('Load error:', error)
  tracks = data
  updatePlaylist()
  if (tracks.length > 0) loadTrack(0)
}

// Render playlist
function updatePlaylist() {
  playlist.innerHTML = ''
  tracks.forEach((track, index) => {
    const isActive = index === currentTrackIndex
    const li = document.createElement('li')
    li.className = `bg-white/10 p-4 rounded-xl border border-gray-500 backdrop-blur-lg shadow-lg transition group flex flex-col items-start justify-between gap-2 ${isActive ? 'ring-2 ring-red-500 border-none' : ''}`

    li.innerHTML = `
      <span class="text-white text-base font-medium truncate w-full">${track.title}</span>
      <div class="w-full flex justify-end gap-5 items-center">
      <button class="text-sm text-red-500  delete-btn" data-id="${track.id}" data-path="${track.url}">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
      <button class=" group-hover:text-white play-btn ">        
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-audio-lines-icon lucide-audio-lines"><path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/></svg>
      </button>
      </div>
    `
    li.querySelector('.play-btn').onclick = () => {
      loadTrack(index)
      spinningDisk.classList.add('playing')
      playIcon.classList.add('hidden')
      pauseIcon.classList.remove('hidden')
    }
    li.querySelector('.delete-btn').onclick = (e) => handleDelete(e)
    playlist.appendChild(li)
  })
}

// Load and play track
function loadTrack(index) {
  const track = tracks[index]
  if (!track) return
  currentTrackIndex = index
  audioPlayer.src = track.url
  trackTitle.textContent = track.title
  audioPlayer.play()
  updatePlaylist()
}

// Play/Pause toggle
playPauseBtn.onclick = () => {
  if (audioPlayer.paused) {
    audioPlayer.play()
    spinningDisk.classList.add('playing')
    playIcon.classList.add('hidden')
    pauseIcon.classList.remove('hidden')
  } else {
    audioPlayer.pause()
    spinningDisk.classList.remove('playing')
    playIcon.classList.remove('hidden')
    pauseIcon.classList.add('hidden')
  }
}

// Navigation
prevBtn.onclick = () => currentTrackIndex > 0 && loadTrack(currentTrackIndex - 1)
nextBtn.onclick = () => currentTrackIndex < tracks.length - 1 && loadTrack(currentTrackIndex + 1)

// Upload track
uploadBtn.onclick = async () => {
  const file = uploadInput.files[0]
  if (!file) return alert('Pilih file dulu.')

  const fileName = `${Date.now()}_${file.name}`
  loadingIndicator.classList.remove('hidden')

  const { data: uploadData, error: uploadError } = await supabase.storage.from('songs').upload(fileName, file)
  if (uploadError) {
    alert('Upload gagal.')
    loadingIndicator.classList.add('hidden')
    return console.error(uploadError)
  }

  const publicUrl = `https://pqnpcpixhbakfgdxrkku.supabase.co/storage/v1/object/public/songs/${fileName}`

  const { error: insertError } = await supabase.from('tracks').insert([{ title: file.name, url: publicUrl }])
  if (insertError) return alert('Gagal simpan ke database.')

  uploadInput.value = ''
  loadingIndicator.classList.add('hidden')
  await loadTracks()
}

// Delete track & file
async function handleDelete(e) {
  e.stopPropagation()
  const btn = e.currentTarget
  const id = btn.dataset.id
  const url = btn.dataset.path
  if (!url) return alert("URL lagu tidak ditemukan.")

  const path = decodeURIComponent(url.split('/songs/')[1])
  const { error: storageError } = await supabase.storage.from('songs').remove([path])
  if (storageError) return alert("Gagal hapus file dari storage.")

  const { error: dbError } = await supabase.from('tracks').delete().eq('id', id)
  if (dbError) return alert("Gagal hapus data di database.")

  alert("Lagu berhasil dihapus.")
  await loadTracks()
}

// Audio player events
audioPlayer.onloadedmetadata = () => {
  progressBar.max = Math.floor(audioPlayer.duration)
  durationDisplay.textContent = formatTime(audioPlayer.duration)
}

audioPlayer.ontimeupdate = () => {
  progressBar.value = Math.floor(audioPlayer.currentTime)
  currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime)

  // Preload next track
  if (audioPlayer.duration - audioPlayer.currentTime < 10) {
    const nextIndex = (currentTrackIndex + 1) % tracks.length
    if (!tracks[nextIndex]?.audioElement) {
      const nextAudio = new Audio(tracks[nextIndex].url)
      nextAudio.preload = 'auto'
      tracks[nextIndex].audioElement = nextAudio
    }
  }
}

progressBar.oninput = () => audioPlayer.currentTime = progressBar.value

audioPlayer.onended = () => {
  pauseIcon.classList.add('hidden')
  playIcon.classList.remove('hidden')

  if (isRepeat) return audioPlayer.play()
  if (isShuffle) {
    let r
    do { r = Math.floor(Math.random() * tracks.length) } while (r === currentTrackIndex)
    return loadTrack(r)
  }

  if (currentTrackIndex < tracks.length - 1) {
    loadTrack(currentTrackIndex + 1)
  } else if (isRepeatPlaylist) {
    loadTrack(0)
  }
}

loadTracks()
