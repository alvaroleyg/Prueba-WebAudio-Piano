const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const notes = [
    { note: "C", freq: 261.63, color: "white" },
    { note: "C#", freq: 277.18, color: "black" },
    { note: "D", freq: 293.66, color: "white" },
    { note: "D#", freq: 311.13, color: "black" },
    { note: "E", freq: 329.63, color: "white" },
    { note: "F", freq: 349.23, color: "white" },
    { note: "F#", freq: 369.99, color: "black" },
    { note: "G", freq: 392.00, color: "white" },
    { note: "G#", freq: 415.30, color: "black" },
    { note: "A", freq: 440.00, color: "white" },
    { note: "A#", freq: 466.16, color: "black" },
    { note: "B", freq: 493.88, color: "white" },
];

const twoOctaves = [...notes, ...notes.map(n => ({ note: n.note.replace(/4/g, '5'), freq: n.freq * 2, color: n.color }))];

const piano = document.getElementById('piano');

// Map of keys to keyboard buttons
const keyBindings = {
    'a': 261.63, // C4
    'w': 277.18, // C#4
    's': 293.66, // D4
    'e': 311.13, // D#4
    'd': 329.63, // E4
    'f': 349.23, // F4
    't': 369.99, // F#4
    'g': 392.00, // G4
    'y': 415.30, // G#4
    'h': 440.00, // A4
    'u': 466.16, // A#4
    'j': 493.88, // B4
    'A': 523.26, // C5
    'W': 554.36, // C#5
    'S': 587.32, // D5
    'E': 622.26, // D#5
    'D': 659.26, // E5
    'F': 698.46, // F5
    'T': 739.98, // F#5
    'G': 784.00, // G5
    'Y': 830.60, // G#5
    'H': 880.00, // A5
    'U': 932.32, // A#5
    'J': 987.76, // B5
};

const activeOscillators = {};
const keyElements = new Map();

twoOctaves.forEach(({ note, freq, color }, index) => {
    const key = document.createElement('div');
    key.className = `key ${color}`;
    key.dataset.freq = freq;

    const label = document.createElement('span');
    label.className = 'key-label';
    label.textContent = note;
    key.appendChild(label);

    keyElements.set(freq, key);

    if (color === "white") {
        piano.appendChild(key);

        // White key click handler
        key.addEventListener('mousedown', () => {
            activateKey(key);
            startTone(freq);
        });
        key.addEventListener('mouseup', () => {
            deactivateKey(key);
            stopTone(freq);
        });
        key.addEventListener('mouseleave', () => {
            deactivateKey(key);
            stopTone(freq);
        });
    } else if (color === "black") {
        const previousWhiteKey = piano.children[piano.children.length - 1];
        previousWhiteKey.style.position = "relative";
        key.style.position = "absolute";
        key.style.left = "40px";
        previousWhiteKey.appendChild(key);

        // Black key click handler
        key.addEventListener('mousedown', (event) => {
            event.stopPropagation(); // Prevent triggering the white key underneath
            activateKey(key);
            startTone(freq);
        });
        key.addEventListener('mouseup', () => {
            deactivateKey(key);
            stopTone(freq);
        });
        key.addEventListener('mouseleave', () => {
            deactivateKey(key);
            stopTone(freq);
        });
    }
});

document.addEventListener('keydown', (event) => {
    const freq = keyBindings[event.key];
    if (freq && !activeOscillators[event.key]) {
        const key = keyElements.get(freq);
        activateKey(key);
        startTone(freq, event.key);
    }
});

document.addEventListener('keyup', (event) => {
    const freq = keyBindings[event.key];
    if (freq) {
        const key = keyElements.get(freq);
        deactivateKey(key);
        stopTone(freq, event.key);
    }
});

function activateKey(key) {
    if (key) key.classList.add('active');
}

function deactivateKey(key) {
    if (key) key.classList.remove('active');
}

function startTone(frequency, key = null) {
    if (key && activeOscillators[key]) return; // Prevent duplicate oscillators

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    // Fade-in: el volumen sube gradualmente al inicio
    gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.02); // 20ms fade-in

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();

    if (key) {
        activeOscillators[key] = { oscillator, gainNode };
    } else {
        activeOscillators[frequency] = { oscillator, gainNode };
    }
}

function stopTone(frequency, key = null) {
    const active = key ? activeOscillators[key] : activeOscillators[frequency];
    if (active) {
        const { oscillator, gainNode } = active;

        // Fade-out: el volumen baja gradualmente al final
        gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.001, audioContext.currentTime + 0.1); // 100ms fade-out
        oscillator.stop(audioContext.currentTime + 0.1);

        if (key) {
            delete activeOscillators[key];
        } else {
            delete activeOscillators[frequency];
        }
    }
}