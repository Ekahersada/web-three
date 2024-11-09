export interface SFXOptions {
    context: AudioContext;
    volume?: number;
    loop?: boolean;
    fadeDuration?: number;
    autoplay?: boolean;
    src: { [key: string]: string };
}

export class SFX {
    private context: AudioContext;
    private gainNode: GainNode;
    private _loop: boolean;
    private fadeDuration: number;
    private autoplay: boolean;
    private buffer: AudioBuffer | null;
    private url: string | undefined;
    private source: AudioBufferSourceNode | undefined;
    private _volume: number | undefined;

    constructor(options: SFXOptions) {
        this.context = options.context;
        const volume = options.volume !== undefined ? options.volume : 1.0;
        this.gainNode = this.context.createGain();
        this.gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        this.gainNode.connect(this.context.destination);
        this._loop = options.loop !== undefined ? options.loop : false;
        this.fadeDuration = options.fadeDuration !== undefined ? options.fadeDuration : 0.5;
        this.autoplay = options.autoplay !== undefined ? options.autoplay : false;
        this.buffer = null;

        let codec: string | undefined;
        for (let prop in options.src) {
            if (SFX.supportsAudioType(prop)) {
                codec = prop;
                break;
            }
        }

        if (codec !== undefined) {
            this.url = options.src[codec];
            this.load(this.url);
        } else {
            console.warn("Browser does not support any of the supplied audio files");
        }
    }

    static supportsAudioType(type: string): boolean {
        let audio: HTMLAudioElement = document.createElement('audio');

        // Allow user to create shortcuts, i.e. just "mp3"
        const formats: { [key: string]: string } = {
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
            aif: 'audio/x-aiff',
            ogg: 'audio/ogg'
        };

        if (!audio) audio = document.createElement('audio');

        return !!audio.canPlayType(formats[type] || type);
    }

    private load(url: string): void {
        // Load buffer asynchronously
        const request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";

        const sfx = this;

        request.onload = function () {
            // Asynchronously decode the audio file data in request.response
            sfx.context.decodeAudioData(
                request.response,
                function (buffer) {
                    if (!buffer) {
                        console.error('error decoding file data: ' + sfx.url);
                        return;
                    }
                    sfx.buffer = buffer;
                    if (sfx.autoplay) sfx.play();
                },
                function (error) {
                    console.error('decodeAudioData error', error);
                }
            );
        }

        request.onerror = function () {
            console.error('SFX Loader: XHR error');
        }

        request.send();
    }

    set loop(value: boolean) {
        this._loop = value;
        if (this.source !== undefined) this.source.loop = value;
    }

    play(): void {
        if (this.buffer === null) return;
        if (this.source !== undefined) this.source.stop();
        this.source = this.context.createBufferSource();
        this.source.loop = this._loop;
        this.source.buffer = this.buffer;
        this.source.connect(this.gainNode);
        this.source.start(0);
    }

    set volume(value: number) {
        this._volume = value;
        this.gainNode.gain.setTargetAtTime(value, this.context.currentTime + this.fadeDuration, 0);
    }

    pause(): void {
        if (this.source === undefined) return;
        this.source.stop();
    }

    stop(): void {
        if (this.source === undefined) return;
        this.source.stop();
        delete this.source;
    }
}