
class SoundService {
    private sounds: Map<string, HTMLAudioElement> = new Map();

    constructor() {
        this.preloadSounds();
    }

    private preloadSounds() {
        // Using some standard arcade sounds
        const soundUrls: Record<string, string> = {
            'clap': 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // Applause
            'pop': 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3', // Pop
            'cheer': 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3', // Cheering
            'click': 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Mechanical click
        };

        Object.entries(soundUrls).forEach(([key, url]) => {
            const audio = new Audio(url);
            audio.volume = 0.5;
            this.sounds.set(key, audio);
        });
    }

    play(name: string) {
        const sound = this.sounds.get(name);
        if (sound) {
            // Clone node to allow overlapping sounds of same type
            const clone = sound.cloneNode() as HTMLAudioElement;
            clone.volume = sound.volume;
            clone.play().catch(e => console.log('Audio play failed', e));
        }
    }
}

export const soundService = new SoundService();
