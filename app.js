// Supabase config
const supabaseUrl = 'https://pqnpcpixhbakfgdxrkku.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbnBjcGl4aGJha2ZnZHhya2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5MzM0NTQsImV4cCI6MjA1OTUwOTQ1NH0.Z16DdMx6HuZVeJodMYXySnMvGD8d_NzS-odTLcSV14c'
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

const audioPlayer = document.getElementById('audioPlayer')
const playPauseBtn = document.getElementById('playPauseBtn')
const prevBtn = document.getElementById('prevBtn')
const nextBtn = document.getElementById('nextBtn')
const uploadInput = document.getElementById('uploadInput')
const trackTitle = document.getElementById('trackTitle')
const playlist = document.getElementById('playlist')
const uploadBtn = document.getElementById('uploadBtn')
const progressBar = document.getElementById('progressBar')
const currentTimeDisplay = document.getElementById('currentTime')
const durationDisplay = document.getElementById('duration')
const playIcon = document.getElementById('playIcon')
const pauseIcon = document.getElementById('pauseIcon')
const spinningDisk = document.getElementById('spinningDisk')

let currentTrackIndex = 0
let tracks = []
let isShuffle = false
let isRepeat = false
let isRepeatPlaylist = false 

document.getElementById('shuffleBtn').addEventListener('click', () => {
  isShuffle = !isShuffle
  document.getElementById('shuffleBtn').classList.toggle('toggled', isShuffle)
  // alert(`Shuffle ${isShuffle ? 'ON' : 'OFF'}`)
})

document.getElementById('repeatBtn').addEventListener('click', () => {
  isRepeat = !isRepeat
  document.getElementById('repeatBtn').classList.toggle('toggled', isRepeat)
  // alert(`Repeat Current Track ${isRepeat ? 'ON' : 'OFF'}`)
})

document.getElementById('repeatPlaylistBtn').addEventListener('click', () => {
  isRepeatPlaylist = !isRepeatPlaylist
  document.getElementById('repeatPlaylistBtn').classList.toggle('toggled', isRepeatPlaylist)
  // alert(`Repeat Playlist ${isRepeatPlaylist ? 'ON' : 'OFF'}`)
})

async function loadTracks() {
  const { data, error } = await supabase.from('tracks').select('*').order('uploaded_at')
  if (error) return console.error('Load error:', error)
  tracks = data
  updatePlaylist()
  if (tracks.length > 0) loadTrack(0)
}

// 
audioPlayer.addEventListener('loadedmetadata', () => {
  progressBar.max = Math.floor(audioPlayer.duration)
  durationDisplay.textContent = formatTime(audioPlayer.duration)
})

audioPlayer.addEventListener('timeupdate', () => {
  progressBar.value = Math.floor(audioPlayer.currentTime);
  currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);

  // Preload the next track when the current track is about to end
  if (audioPlayer.duration - audioPlayer.currentTime < 10) { // 10 seconds before the end
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    if (!tracks[nextIndex].audioElement) {
      const nextAudio = new Audio(tracks[nextIndex].url);
      nextAudio.preload = 'auto';
      tracks[nextIndex].audioElement = nextAudio;
    }
  }
})

progressBar.addEventListener('input', () => {
  audioPlayer.currentTime = progressBar.value
})

audioPlayer.addEventListener('play', () => {
  playIcon.classList.add('hidden')
  pauseIcon.classList.remove('hidden')
})

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
}
// 

function updatePlaylist() {
  playlist.innerHTML = ''
  tracks.forEach((track, index) => {
    const li = document.createElement('li')
    li.className = 'bg-white/10 backdrop-blur-lg p-4 rounded-xl flex flex-col items-start border border-opacity-30 shadow-lg border-gray-500 justify-between gap-2 transition group'

    li.innerHTML = `
      <span class="text-white text-base font-medium truncate w-full">${track.title}</span>
      <div class="w-full flex justify-end gap-5 items-center">
      <button class="text-sm text-red-500  delete-btn" data-id="${track.id}" data-path="${track.url}">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>

      </button>
      <button class=" group-hover:text-white play-btn">        
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-audio-lines-icon lucide-audio-lines"><path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/></svg>


      </button>
      
      </div>
    `

    li.querySelector('.play-btn').addEventListener('click', () => loadTrack(index))

    li.querySelector('.delete-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      const trackId = e.currentTarget.dataset.id; // Use e.currentTarget to get the button element
      const url = e.currentTarget.dataset.path; // Use e.currentTarget to get the correct data-path

      if (!url) {
        console.error("Track URL is undefined. Cannot delete.");
        alert("Gagal hapus file. URL tidak ditemukan.");
        return;
      }
      const path = decodeURIComponent(url.split('/songs/')[1]);
      alert("Lagu berhasil dihapus.");
      await loadTracks();
    })

    playlist.appendChild(li)
  })
}


function loadTrack(index) {
  const track = tracks[index]
  if (!track) return
  currentTrackIndex = index
  audioPlayer.src = track.url
  trackTitle.textContent = track.title
  audioPlayer.play()
}

playPauseBtn.addEventListener('click', () => {
  if (audioPlayer.paused) {
    audioPlayer.play();
    spinningDisk.classList.add('playing'); // Start spinning
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
  } else {
    audioPlayer.pause();
    spinningDisk.classList.remove('playing'); // Stop spinning
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
  }
});

prevBtn.onclick = () => {
  if (currentTrackIndex > 0) loadTrack(currentTrackIndex - 1)
}

nextBtn.onclick = () => {
  if (currentTrackIndex < tracks.length - 1) loadTrack(currentTrackIndex + 1)
}


uploadBtn.addEventListener('click', async () => {
  const file = uploadInput.files[0]
  if (!file) {
    alert('Pilih file dulu')
    return
  }

  const fileName = `${Date.now()}_${file.name}`
  document.getElementById('loading').classList.remove('hidden')
  console.log("Uploading file:", fileName)

  const { data: uploadData, error: uploadError } = await supabase.storage.from('songs').upload(fileName, file)

  if (uploadError) {
    console.error('Upload gagal:', uploadError)
    alert('Upload gagal. Coba lagi.')
    document.getElementById('loading').classList.add('hidden')
    return
  }

  console.log("File uploaded successfully:", uploadData)
  document.getElementById('loading').classList.add('hidden')
  const supabasePublicBase = "https://pqnpcpixhbakfgdxrkku.supabase.co/storage/v1/object/public/songs/"
  const publicUrl = `${supabasePublicBase}${fileName}`
  console.log("Generated Public URL:", publicUrl)

  const { error: insertError } = await supabase.from('tracks').insert([
    {
      title: file.name,
      url: publicUrl
    }
  ])

  if (insertError) {
    console.error('Gagal simpan ke database:', insertError)
    alert('Gagal simpan data lagu.')
    return
  }

  console.log('Track berhasil disimpan ke database.')
  // alert('Lagu berhasil di-upload!')
  uploadInput.value = '' // reset input
  await loadTracks()
})

audioPlayer.addEventListener('ended', () => {
  pauseIcon.classList.add('hidden')
  playIcon.classList.remove('hidden')

  if (isRepeat) {
    audioPlayer.currentTime = 0
    audioPlayer.play()
    return
  }

  if (isShuffle) {
    let randomIndex
    do {
      randomIndex = Math.floor(Math.random() * tracks.length)
    } while (randomIndex === currentTrackIndex)
    loadTrack(randomIndex)
    return
  }

  if (currentTrackIndex < tracks.length - 1) {
    loadTrack(currentTrackIndex + 1)
  } else if (isRepeatPlaylist) {
    loadTrack(0) 
  }
})

loadTracks()
