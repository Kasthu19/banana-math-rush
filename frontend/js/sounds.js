// frontend/js/sounds.js
const SoundEffects = (() => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playTone(freq, type, duration, volume = 0.1) {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    }

    return {
        correct: () => {
            playTone(523.25, 'sine', 0.2); // C5
            setTimeout(() => playTone(659.25, 'sine', 0.3), 100); // E5
        },
        wrong: () => {
            playTone(150, 'sawtooth', 0.5, 0.05);
        },
        gameOver: () => {
            playTone(440, 'triangle', 0.5);
            setTimeout(() => playTone(349.23, 'triangle', 0.5), 200);
            setTimeout(() => playTone(261.63, 'triangle', 0.8), 400);
        },
        levelUp: () => {
            [523, 659, 783, 1046].forEach((f, i) => {
                setTimeout(() => playTone(f, 'square', 0.3, 0.03), i * 100);
            });
        }
    };
})();
