function addClickSound() {
    /* on click */
    let inputArray = document.querySelectorAll('input[type=button], .buttonExit');
    inputArray.forEach(function (button) {
        button.addEventListener('click', function () {
            if (sounds.enabled == true) {
                sounds.click.play();
            }
        });
    });
    /* on input */
    inputArray = document.querySelectorAll('input[type=number]');
    inputArray.forEach(function (exit) {
        exit.addEventListener('input', function () {
            if (sounds.enabled == true) {
                sounds.click.play();
            }
        });
    });
}

function changeVolume(vol) {//broken
    console.log('change volume: ' + vol)
    if (vol == 0 && sounds.enabled == true) {
        sounds.enabled = false;
    } else if (sounds.enabled == false) {
        sounds.enabled = true;
    }
    sounds.click.volume(vol + 0.2);
    sounds.hammer.volume(vol);
    console.log({ click: sounds.click.volume, hammer: sounds.hammer.volume })
}

class musicsController {
    constructor() {
        this.current = undefined;
        this.enabled = true;
        this.musicsTable = [
            new Howl({
                src: ['music/schlumpf.wav'],
                volume: 0.5,
            }),
            new Howl({
                src: ['music/classic.wav'],
                volume: 0.5,
            })
        ];
        let self = this;
        this.musicsTable.forEach(music => {
            music.on('end', () => self.songEnd(self))
        });
    }
    start(index = rand(0, this.musicsTable.length-1)) {
        if (this.enabled) {
            if(this.musicsTable[index] == undefined){
                console.error(new Error('music at specified index does not exist.'));
            } else {
                this.musicsTable[index].play();
                this.current = index;
                console.log('music started: '+index);
            }
        }
    }
    stop() {
        if(this.current != undefined){
            this.musicsTable[this.current].stop();
            this.current = undefined;
            console.log('music stopped');
        }
    }
    songEnd(self) {
        let nextSong = 0;
        do {
            nextSong = rand(0, self.musicsTable.length - 1);
        } while (nextSong == self.current);
        self.musicsTable[nextSong].play();
        self.current = nextSong;
        console.log('next song: '+nextSong);
    }
}