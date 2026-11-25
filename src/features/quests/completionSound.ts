const key = 'quest-completion-sound';
export const maxCompletionSoundMB = 10;
const maxBytes = maxCompletionSoundMB * 1024 * 1024;
let context: AudioContext | undefined;
let decodedClip: { data: string; buffer: AudioBuffer } | undefined;

async function soundStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('quest-audio', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('sounds');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction('sounds', mode);
      const request = operation(transaction.objectStore('sounds'));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

type CompletionSound = { data: string; filename: string | null };

export async function readCompletionSound(): Promise<CompletionSound | null> {
  try {
    const saved = await soundStore<CompletionSound | string | null | undefined>(
      'readonly',
      (store) => store.get(key),
    );
    if (saved !== undefined)
      return typeof saved === 'string'
        ? { data: saved, filename: null }
        : saved;
  } catch {
    // Fall back to recordings saved by the previous version.
  }
  try {
    const data = localStorage.getItem(key);
    return data ? { data, filename: null } : null;
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
    throw Error(
      `Choose an M4A, MP3, or WAV file up to ${maxCompletionSoundMB} MB.`,
    );
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
    await soundStore('readwrite', (store) =>
      store.put({ data: clip, filename: file.name }, key),
    );
  } catch {
    throw Error('Could not save the recording in this browser.');
  }
  decodedClip = buffer ? { data: clip, buffer } : undefined;
}

export async function removeCompletionSound() {
  // A stored null also suppresses any recording from the previous version.
  await soundStore('readwrite', (store) => store.put(null, key));
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
          const clip = (await readCompletionSound())?.data;
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
