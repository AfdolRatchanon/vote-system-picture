const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

export const playClap = () => {
    if (audioContext.state === 'suspended') audioContext.resume();

    // Create noise buffer for "clap" texture
    const bufferSize = audioContext.sampleRate * 2; // 2 seconds buffer
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;

    const gainCheck = audioContext.createGain();

    // Envelope for clap: fast attack, fast exponential decay
    noise.connect(filter);
    filter.connect(gainCheck);
    gainCheck.connect(audioContext.destination);

    const now = audioContext.currentTime;
    gainCheck.gain.setValueAtTime(0, now);
    gainCheck.gain.linearRampToValueAtTime(1, now + 0.005); // Attack
    gainCheck.gain.exponentialRampToValueAtTime(0.01, now + 0.2); // Decay

    noise.start(now);
    noise.stop(now + 0.2);
};

export const playPop = () => {
    if (audioContext.state === 'suspended') audioContext.resume();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';

    const now = audioContext.currentTime;

    // Pitch drop for "pop" sound
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.1);

    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
};

export const playClick = () => {
    if (audioContext.state === 'suspended') audioContext.resume();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'square'; // Clicky texture

    const now = audioContext.currentTime;

    // Very short high frequency blip
    oscillator.frequency.setValueAtTime(1200, now);
    oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.05);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.05);
};

export const playCheer = () => {
    if (audioContext.state === 'suspended') audioContext.resume();

    // Multiple oscillators to simulate crowd
    const now = audioContext.currentTime;
    const duration = 1.5;

    const createOscillator = (freq: number) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.frequency.value = freq + Math.random() * 50;
        osc.type = 'sawtooth';

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.2);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start(now);
        osc.stop(now + duration);
    };

    for (let i = 0; i < 10; i++) {
        createOscillator(200 + Math.random() * 400); // 200-600Hz range for voices
    }
};

export const playSoundById = (id: string) => {
    switch (id) {
        case 'clap': playClap(); break;
        case 'pop': playPop(); break;
        case 'click': playClick(); break;
        case 'cheer': playCheer(); break;
        default: console.log("Unknown sound:", id);
    }
};
