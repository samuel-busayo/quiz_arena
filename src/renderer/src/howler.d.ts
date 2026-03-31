declare module 'howler' {
    export class Howl {
        constructor(options: any);
        play(): void;
        pause(): void;
        stop(): void;
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
