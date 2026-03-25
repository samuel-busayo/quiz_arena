declare module 'howler' {
    export class Howl {
        constructor(options: any);
        play(): void;
        pause(): void;
        stop(): void;
        volume(val: number): void;
        on(event: string, callback: () => void): void;
    }
}
