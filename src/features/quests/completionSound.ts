const key = 'quest-completion-sound';
const maxBytes = 512 * 1024;
let context: AudioContext | undefined;
let decodedClip: { data: string; buffer: AudioBuffer } | undefined;

export function readCompletionSound() {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function saveCompletionSound(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const type =
    extension === 'm4a'
      ? 'audio/mp4'
      : extension === 'mp3'
        ? 'audio/mpeg'
        : extension === 'wav'
          ? 'audio/wav'
          : '';
  if (!type || !file.size || file.size > maxBytes)
    throw Error('Choose an M4A, MP3, or WAV file up to 512 KB.');
  const blob = new Blob([file], { type });
  let buffer: AudioBuffer | undefined;
  if (typeof AudioContext !== 'undefined') {
    try {
      const audio = (context ??= new AudioContext());
      buffer = await audio.decodeAudioData(await blob.arrayBuffer());
    } catch {
      throw Error('This browser could not play the recording.');
    }
  }
  const clip = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(Error('Could not read the recording.'));
    reader.readAsDataURL(blob);
  });
  try {
    localStorage.setItem(key, clip);
  } catch {
    throw Error('Could not save the recording in this browser.');
  }
  decodedClip = buffer ? { data: clip, buffer } : undefined;
  return clip;
}

export function removeCompletionSound() {
  localStorage.removeItem(key);
  decodedClip = undefined;
}

function playDefaultChime(audio: AudioContext) {
  const now = audio.currentTime;
  for (const [frequency, delay] of [
    [523.25, 0],
    [783.99, 0.09],
  ]) {
    const start = now + delay;
    const note = audio.createOscillator();
    const volume = audio.createGain();
    note.frequency.value = frequency;
    note.connect(volume).connect(audio.destination);
    volume.gain.setValueAtTime(0, start);
    volume.gain.linearRampToValueAtTime(0.13, start + 0.015);
    volume.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
    note.start(start);
    note.stop(start + 0.19);
  }
}

export function prepareCompletionSound() {
  const clip = readCompletionSound();
  if (typeof AudioContext === 'undefined') return undefined;

  try {
    const audio = (context ??= new AudioContext());
    // Resume during the tap or swipe release, before the completion animation.
    const ready = audio.resume().then(
      () => true,
      () => false,
    );
    return () => {
      void ready
        .then(async (resumed) => {
          if (!resumed) return;
          if (!clip) {
            playDefaultChime(audio);
            return;
          }
          if (decodedClip?.data !== clip) {
            const bytes = Uint8Array.from(
              atob(clip.split(',')[1]),
              (character) => character.charCodeAt(0),
            );
            decodedClip = {
              data: clip,
              buffer: await audio.decodeAudioData(bytes.buffer),
            };
          }
          const source = audio.createBufferSource();
          source.buffer = decodedClip.buffer;
          source.connect(audio.destination);
          source.start();
        })
        .catch(() => {
          // Playback is optional and must never interfere with awarding XP.
        });
    };
  } catch {
    return undefined;
  }
}
