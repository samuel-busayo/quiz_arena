declare module 'howler' {
    export class Howl {
        constructor(options: any);
        play(): number;
        play(sprite: string): number;
        pause(id?: number): void;
        stop(id?: number): void;
        volume(): number;
        volume(val: number): void;
        on(event: string, callback: () => void): void;
        fade(from: number, to: number, duration: number): void;
        loop(val?: boolean): void;
        playing(): boolean;
    }
}

declare module '*.mp3' {
    const src: string;
    export default src;
}
