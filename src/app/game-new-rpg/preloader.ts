
import { FBXLoader } from 'three/examples/jsm/Addons.js'


export interface PreloaderOptions {
    assets: string[];
    container?: HTMLElement;
    onprogress?: (progress: number) => void;
    oncomplete?: () => void;
}

interface Asset {
    loaded: number;
    complete: boolean;
    total?: number;
}

export class PreloaderInit {
    assets: { [key: string]: Asset };
    container?: HTMLElement;
    domElement?: HTMLElement;
    progressBar?: HTMLElement;
    onprogress: (progress: number) => void;
    oncomplete: () => void;

    constructor(options: PreloaderOptions) {
        this.assets = {};
        for (let asset of options.assets) {
            this.assets[asset] = { loaded: 0, complete: false };
            this.loadFBX(asset);
        }
        this.container = options.container;



        if (options.onprogress === undefined) {
            this.onprogress = this.defaultOnProgress;
            this.createProgressBar();

            console.log('undefined');
        } else {
            this.onprogress = options.onprogress;

        }

        this.oncomplete = options.oncomplete || (() => {

           
        });
    }

    private createProgressBar() {
        this.domElement = document.createElement("div");
        this.domElement.style.position = 'absolute';
        this.domElement.style.top = '0';
        this.domElement.style.left = '0';
        this.domElement.style.width = '100%';
        this.domElement.style.height = '100%';
        this.domElement.style.background = '#000';
        this.domElement.style.opacity = '0.7';
        this.domElement.style.display = 'flex';
        this.domElement.style.alignItems = 'center';
        this.domElement.style.justifyContent = 'center';
        this.domElement.style.zIndex = '1111';

        const barBase = document.createElement("div");
        barBase.style.background = '#aaa';
        barBase.style.width = '50%';
        barBase.style.minWidth = '250px';
        barBase.style.borderRadius = '10px';
        barBase.style.height = '15px';
        this.domElement.appendChild(barBase);

        const bar = document.createElement("div");
        bar.style.background = '#2a2';
        bar.style.borderRadius = '10px';
        bar.style.height = '100%';
        bar.style.width = '0';
        barBase.appendChild(bar);

        this.progressBar = bar;

        if (this.container == undefined) {
            document.body.appendChild(this.domElement);
        } else {
            this.container.appendChild(this.domElement);
        }
        // document.body.appendChild(this.domElement);

        

        console.log(this.container)
      
    }

    private defaultOnProgress(progress: number) {
        if (this.progressBar) {
            const progressPercentage = progress * 100;
            this.progressBar.style.width = `${progressPercentage}%`;
        }
    }

    private checkCompleted(): boolean {
        for (let prop in this.assets) {
            const asset = this.assets[prop];
            if (!asset.complete) return false;
        }
        return true;
    }

    get progress(): number {
        let total = 0;
        let loaded = 0;

        for (let prop in this.assets) {
            const asset = this.assets[prop];
            if (asset.total === undefined) {
                loaded = 0;
                break;
            }
            loaded += asset.loaded;
            total += asset.total;
        }

        return loaded / total;
    }

    private load(url: string) {

        console.log(url);
        const loader = this;
        const xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', url, true);
        xobj.onreadystatechange = function () {
            if (xobj.readyState === 4 && xobj.status === 200) {
                loader.assets[url].complete = true;
                if (loader.checkCompleted()) {

                    if (loader.domElement !== undefined) {
                        if (loader.container !== undefined) {
                            loader.container.removeChild(loader.domElement);
                        } else {
                            document.body.removeChild(loader.domElement);
                        }
                    }
                    loader.oncomplete();
                }
            }
        };
        xobj.onprogress = function (e) {
            const asset = loader.assets[url];
            asset.loaded = e.loaded;
            asset.total = e.total;
            loader.onprogress(loader.progress);
        };
        xobj.send(null);
    
    }

    private loadFBX(url: string) {
        const loader = new FBXLoader();
        loader.load(
            url,
            (object:any) => {
                this.assets[url].complete = true;

                if (this.checkCompleted()) {
                    if (this.domElement !== undefined) {
                        if (this.container !== undefined) {
                            this.container.removeChild(this.domElement);
                        } else {
                            document.body.removeChild(this.domElement);
                        }
                    }
                    this.oncomplete();

                    console.log(object);
                }
            },
            (xhr:any) => {
                const asset = this.assets[url];
                asset.loaded = xhr.loaded;
                asset.total = xhr.total;
                this.onprogress(this.progress);
            },
            (error:any) => {
                console.error('An error happened', error);
            }
        );
    }
}