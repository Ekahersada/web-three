class Easing {
    private b: number;
    private c: number;
    private d: number;
    private type: string;
    private startTime: number;
    private t: number = 0;

    constructor(start: number, end: number, duration: number, startTime: number = 0, type: string = 'linear') {
        this.b = start;
        this.c = end - start;
        this.d = duration;
        this.type = type;
        this.startTime = startTime;
    }

    value(time: number): number {
        this.t = time - this.startTime;
        return (this as any)[this.type]();
    }

    linear(): number {
        return this.c * (this.t / this.d) + this.b;
    }

    inQuad(): number {
        return this.c * (this.t /= this.d) * this.t + this.b;
    }

    outQuad(): number {
        return -this.c * (this.t /= this.d) * (this.t - 2) + this.b;
    }

    inOutQuad(): number {
        if ((this.t /= this.d / 2) < 1) return this.c / 2 * this.t * this.t + this.b;
        return -this.c / 2 * ((--this.t) * (this.t - 2) - 1) + this.b;
    }

    projectile(): number {
        const c = this.c;
        const b = this.b;
        const t = this.t;
        this.t *= 2;
        let result: number;
        let func: string;
        if (this.t < this.d) {
            result = this.outQuad();
            func = "outQuad";
        } else {
            this.t -= this.d;
            this.b += c;
            this.c = -c;
            result = this.inQuad();
            func = "inQuad";
        }
        console.log(`projectile: ${result.toFixed(2)} time:${this.t.toFixed(2)} func:${func}`);
        this.b = b;
        this.c = c;
        this.t = t;
        return result;
    }

    inCubic(): number {
        return this.c * (this.t /= this.d) * this.t * this.t + this.b;
    }

    outCubic(): number {
        return this.c * ((this.t = this.t / this.d - 1) * this.t * this.t + 1) + this.b;
    }

    inOutCubic(): number {
        if ((this.t /= this.d / 2) < 1) return this.c / 2 * this.t * this.t * this.t + this.b;
        return this.c / 2 * ((this.t -= 2) * this.t * this.t + 2) + this.b;
    }

    inQuart(): number {
        return this.c * (this.t /= this.d) * this.t * this.t * this.t + this.b;
    }

    outQuart(): number {
        return -this.c * ((this.t = this.t / this.d - 1) * this.t * this.t * this.t - 1) + this.b;
    }

    inOutQuart(): number {
        if ((this.t /= this.d / 2) < 1) return this.c / 2 * this.t * this.t * this.t * this.t + this.b;
        return -this.c / 2 * ((this.t -= 2) * this.t * this.t * this.t - 2) + this.b;
    }

    inQuint(): number {
        return this.c * (this.t /= this.d) * this.t * this.t * this.t * this.t + this.b;
    }

    outQuint(): number {
        return this.c * ((this.t = this.t / this.d - 1) * this.t * this.t * this.t * this.t + 1) + this.b;
    }

    inOutQuint(): number {
        if ((this.t /= this.d / 2) < 1) return this.c / 2 * this.t * this.t * this.t * this.t * this.t + this.b;
        return this.c / 2 * ((this.t -= 2) * this.t * this.t * this.t * this.t + 2) + this.b;
    }

    inSine(): number {
        return -this.c * Math.cos(this.t / this.d * (Math.PI / 2)) + this.c + this.b;
    }

    outSine(): number {
        return this.c * Math.sin(this.t / this.d * (Math.PI / 2)) + this.b;
    }

    inOutSine(): number {
        return -this.c / 2 * (Math.cos(Math.PI * this.t / this.d) - 1) + this.b;
    }

    inExpo(): number {
        return (this.t == 0) ? this.b : this.c * Math.pow(2, 10 * (this.t / this.d - 1)) + this.b;
    }

    outExpo(): number {
        return (this.t == this.d) ? this.b + this.c : this.c * (-Math.pow(2, -10 * this.t / this.d) + 1) + this.b;
    }

    inOutExpo(): number {
        if (this.t == 0) return this.b;
        if (this.t == this.d) return this.b + this.c;
        if ((this.t /= this.d / 2) < 1) return this.c / 2 * Math.pow(2, 10 * (this.t - 1)) + this.b;
        return this.c / 2 * (-Math.pow(2, -10 * --this.t) + 2) + this.b;
    }

    inCirc(): number {
        return -this.c * (Math.sqrt(1 - (this.t /= this.d) * this.t) - 1) + this.b;
    }

    outCirc(): number {
        return this.c * Math.sqrt(1 - (this.t = this.t / this.d - 1) * this.t) + this.b;
    }

    inOutCirc(): number {
        if ((this.t /= this.d / 2) < 1) return -this.c / 2 * (Math.sqrt(1 - this.t * this.t) - 1) + this.b;
        return this.c / 2 * (Math.sqrt(1 - (this.t -= 2) * this.t) + 1) + this.b;
    }

    inElastic(): number {
        let s = 1.70158, p = 0, a = this.c;
        if (this.t == 0) return this.b;
        if ((this.t /= this.d) == 1) return this.b + this.c;
        if (!p) p = this.d * .3;
        if (a < Math.abs(this.c)) { a = this.c; s = p / 4; }
        else s = p / (2 * Math.PI) * Math.asin(this.c / a);
        return -(a * Math.pow(2, 10 * (this.t -= 1)) * Math.sin((this.t * this.d - s) * (2 * Math.PI) / p)) + this.b;
    }

    outElastic(): number {
        let s = 1.70158, p = 0, a = this.c;
        if (this.t == 0) return this.b;
        if ((this.t /= this.d) == 1) return this.b + this.c;
        if (!p) p = this.d * .3;
        if (a < Math.abs(this.c)) { a = this.c; s = p / 4; }
        else s = p / (2 * Math.PI) * Math.asin(this.c / a);
        return a * Math.pow(2, -10 * this.t) * Math.sin((this.t * this.d - s) * (2 * Math.PI) / p) + this.c + this.b;
    }

    inOutElastic(): number {
        let s = 1.70158, p = 0, a = this.c;
        if (this.t == 0) return this.b;
        if ((this.t /= this.d / 2) == 2) return this.b + this.c;
        if (!p) p = this.d * (.3 * 1.5);
        if (a < Math.abs(this.c)) { a = this.c; s = p / 4; }
        else s = p / (2 * Math.PI) * Math.asin(this.c / a);
        if (this.t < 1) return -.5 * (a * Math.pow(2, 10 * (this.t -= 1)) * Math.sin((this.t * this.d - s) * (2 * Math.PI) / p)) + this.b;
        return a * Math.pow(2, -10 * (this.t -= 1)) * Math.sin((this.t * this.d - s) * (2 * Math.PI) / p) * .5 + this.c + this.b;
    }

    inBack(): number {
        const s = 1.70158;
        return this.c * (this.t /= this.d) * this.t * ((s + 1) * this.t - s) + this.b;
    }

    outBack(): number {
        const s = 1.70158;
        return this.c * ((this.t = this.t / this.d - 1) * this.t * ((s + 1) * this.t + s) + 1) + this.b;
    }

    inOutBack(): number {
        let s = 1.70158;
        if ((this.t /= this.d / 2) < 1) return this.c / 2 * (this.t * this.t * (((s *= (1.525)) + 1) * this.t - s)) + this.b;
        return this.c / 2 * ((this.t -= 2) * this.t * (((s *= (1.525)) + 1) * this.t + s) + 2) + this.b;
    }

    inBounce(t: number = this.t, b: number = this.b): number {
        return this.c - this.outBounce(this.d - t, 0) + b;
    }

    outBounce(t: number = this.t, b: number = this.b): number {
        if ((t /= this.d) < (1 / 2.75)) {
            return this.c * (7.5625 * t * t) + b;
        } else if (t < (2 / 2.75)) {
            return this.c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
        } else if (t < (2.5 / 2.75)) {
            return this.c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
        } else {
            return this.c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
        }
    }

    inOutBounce(): number {
        if (this.t < this.d / 2) return this.inBounce(this.t * 2, 0) * .5 + this.b;
        return this.outBounce(this.t * 2 - this.d, 0) * .5 + this.c * .5 + this.b;
    }
}

export class Tween {
    private target: any;
    private channel: string;
    private endValue: number;
    private duration: number;
    private oncomplete: (() => void) | undefined;
    private currentTime: number = 0;
    private finished: boolean = false;
    private easing: Easing;

    constructor(target: any, channel: string, endValue: number, duration: number, oncomplete?: () => void, easing: string = "inOutQuad") {
        this.target = target;
        this.channel = channel;
        this.oncomplete = oncomplete;
        this.endValue = endValue;
        this.duration = duration;
        this.easing = new Easing(target[channel], endValue, duration, 0, easing);
    }

    update(dt: number): void {

        console.log(this.finished);
        if (this.finished) return;
        this.currentTime += dt;
        if (this.currentTime >= this.duration) {
            this.target[this.channel] = this.endValue;
            if (this.oncomplete) this.oncomplete();
            this.finished = true;

            
        } else {
            this.target[this.channel] = this.easing.value(this.currentTime);
        }
    }
}