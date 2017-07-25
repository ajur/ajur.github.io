// random walk on canvas
// autor: Adam Jurczyk

var bkg = document.getElementById('bkg');
var counter = document.getElementById('counter');

var ctx = bkg.getContext('2d');

var RECT_SIZE = 4;
var RECT_FILL_SIZE = 3;

var FG_COLORS = [
    "#268bd2",
    "#2aa198",
    "#859900",
    "#b58900",
    "#cb4b16",
    "#dc322f",
    "#d33682",
    "#6c71c4"];
var FG_COLOR_RAND_CHANCE = 0.01;

var fullWidth, fullHeight,
    cols, rows,
    steps_per_frame = 4,
    walker, isWalking = true,
    fillStyle = 'rand';

var randDir = function(){
    return Math.floor(Math.random()*3-1);
};
var modulo = function(a,d){
    return a - d * Math.floor(a/d);
};

var randFgColor = function(){
    return FG_COLORS[Math.floor(Math.random() * FG_COLORS.length)];
};

var Walker = function(){
    this.col = Math.round(cols/2),
    this.row = Math.round(rows/2),
    this.age = 0;

    this.walk = function(){

        if(fillStyle == 'rand' && Math.random() < FG_COLOR_RAND_CHANCE){
            ctx.fillStyle = randFgColor();
        }

        this.col = modulo(this.col + randDir(), cols);
        this.row = modulo(this.row + randDir(), rows);
        ctx.fillRect(this.col*RECT_SIZE, this.row*RECT_SIZE,
                     RECT_FILL_SIZE, RECT_FILL_SIZE);
    }
};


var onframe = function(timestamp){
    if(isWalking)
        window.requestAnimationFrame(onframe);
    for(var i=steps_per_frame; i>0; --i){
        walker.walk();
        ++walker.age;
    }
    counter.innerHTML = walker.age;
};

var init = function(evt){
    fullWidth = bkg.width = bkg.offsetWidth;
    fullHeight = bkg.height = bkg.offsetHeight;
    cols = Math.round(fullWidth/RECT_SIZE);
    rows = Math.round(fullHeight/RECT_SIZE);
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = randFgColor();
    walker = new Walker();
};
window.addEventListener('resize', init);


var controls = document.getElementById('controls');
var settings = document.getElementById('settings');

var playpause = controls.getElementsByClassName('playpause')[0];
playpause.addEventListener('click', function(evt){
    if(isWalking){
        playpause.classList.remove('fa-pause');
        playpause.classList.add('fa-play');
    }else{
        playpause.classList.remove('fa-play');
        playpause.classList.add('fa-pause');
        window.requestAnimationFrame(onframe);
    }
    isWalking = !isWalking;
});
var gear = controls.getElementsByClassName('fa-gear')[0];
gear.addEventListener('click', function(evt){
    if(settings.classList.contains('hidden'))
        settings.classList.remove('hidden');
    else
        settings.classList.add('hidden');
});


var fgColorRadios = settings.querySelectorAll('input[name="fg-color"]');
Array.prototype.forEach.call(fgColorRadios, function(radio){
    radio.addEventListener('change', function(e){
        fillStyle = e.target.value;
        if(fillStyle=='rand'){
            ctx.fillStyle = randFgColor();
        }else{
            ctx.fillStyle = '#' + fillStyle;
        }
    });
});
var bgColorRadios = settings.querySelectorAll('input[name="bg-color"]');
Array.prototype.forEach.call(bgColorRadios, function(radio){
    radio.addEventListener('change', function(e){
        bkg.style.backgroundColor = '#'+e.target.value;
    });
});
var speedRadios = settings.querySelectorAll('input[name="speed"]');
Array.prototype.forEach.call(speedRadios, function(radio){
    radio.addEventListener('change', function(e){
        steps_per_frame = +e.target.value;
    });
});



init();
window.requestAnimationFrame(onframe);
