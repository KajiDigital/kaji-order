let ctx: AudioContext | null = null
let loopTimer: number | null = null
let playing = false

function getCtx() {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

export function unlockAlertAudio() {
  const audio = getCtx()
  if (audio.state === 'suspended') {
    void audio.resume()
  }
  return audio.state !== 'suspended'
}

function playBurst(audio: AudioContext) {
  const master = audio.createGain()
  master.gain.value = 0.85
  master.connect(audio.destination)

  const notes = [
    { freq: 880, at: 0 },
    { freq: 1320, at: 0.16 },
    { freq: 880, at: 0.32 },
    { freq: 1480, at: 0.48 },
  ]

  for (const note of notes) {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'square'
    osc.frequency.value = note.freq
    const start = audio.currentTime + note.at
    const end = start + 0.13
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.9, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    osc.connect(gain)
    gain.connect(master)
    osc.start(start)
    osc.stop(end + 0.02)
  }
}

export function playOrderAlertBurst() {
  try {
    const audio = getCtx()
    void audio.resume().then(() => playBurst(audio))
  } catch {
    /* ignore */
  }
}

export function startOrderAlertLoop() {
  if (playing) return
  playing = true
  const tick = () => {
    if (!playing) return
    playOrderAlertBurst()
    loopTimer = window.setTimeout(tick, 1600)
  }
  tick()
}

export function stopOrderAlertLoop() {
  playing = false
  if (loopTimer != null) {
    window.clearTimeout(loopTimer)
    loopTimer = null
  }
}

export function isOrderAlertPlaying() {
  return playing
}
