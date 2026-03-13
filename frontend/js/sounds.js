// frontend/js/sounds.js
const SoundEffects = (() => {
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function playTone(freq, type, duration, volume = 0.1) {
        const ctx = initAudio();
        
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + duration);
    }

    return {
        resume: () => {
            const ctx = initAudio();
            if (ctx.state === 'suspended') {
                ctx.resume().then(() => {
                    console.log("AudioContext resumed successfully");
                }).catch(err => {
                    console.error("Failed to resume AudioContext:", err);
                });
            }
        },
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
