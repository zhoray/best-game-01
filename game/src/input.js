import { WIDTH, HEIGHT } from './config.js';

export function createInput(canvas) {
    const target = { x: WIDTH / 2, y: HEIGHT / 2 };
    const held = new Set();
    const flags = {};
    let pointerDown = false;

    const onPointerMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        target.x = (e.clientX - rect.left) * (WIDTH / rect.width);
        target.y = (e.clientY - rect.top) * (HEIGHT / rect.height);
    };

    const onPointerDown = (e) => {
        pointerDown = true;
        flags.confirm = true;
        onPointerMove(e);
    };

    const onPointerUp = () => {
        pointerDown = false;
    };

    const onKeyDown = (e) => {
        const code = e.code;
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(code)) {
            e.preventDefault();
        }
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(code)) {
            held.add(code);
        }
        if (code === 'Enter' || code === 'Space') {
            flags.confirm = true;
        }
        if (code === 'KeyP' || code === 'Escape') {
            flags.pause = true;
        }
        if (code === 'KeyM') {
            flags.mute = true;
        }
        if (code === 'KeyR') {
            flags.restart = true;
        }
    };

    const onKeyUp = (e) => {
        held.delete(e.code);
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return {
        target,
        held,
        consume(name) {
            const value = !!flags[name];
            flags[name] = false;
            return value;
        },
        get pointerDown() {
            return pointerDown;
        },
        detach() {
            canvas.removeEventListener('pointermove', onPointerMove);
            canvas.removeEventListener('pointerdown', onPointerDown);
            canvas.removeEventListener('pointerup', onPointerUp);
            canvas.removeEventListener('pointerleave', onPointerUp);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        }
    };
}
