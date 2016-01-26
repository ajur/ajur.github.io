// random walk on canvas
// autor: Adam Jurczyk

var bkg = document.getElementById('bkg');
var counter = document.getElementById('counter');

var ctx = bkg.getContext('2d');

var RECT_SIZE = 4;
var RECT_FILL_SIZE = 3;

var fullWidth, fullHeight,
    cols, rows,
    walker, isWalking = true,
    fillStyle = '#268bd2';

var randDir = function(){
    return Math.floor(Math.random()*3-1);
};
var modulo = function(a,d){
    return a - d * Math.floor(a/d);
};

var Walker = function(){
    this.col = Math.round(cols/2),
    this.row = Math.round(rows/2),
    this.age = 0;
        
    this.walk = function(){
        this.col = modulo(this.col + randDir(), cols);
        this.row = modulo(this.row + randDir(), rows);
        ctx.fillRect(this.col*RECT_SIZE, this.row*RECT_SIZE, 
                     RECT_FILL_SIZE, RECT_FILL_SIZE);
    }
};


var onframe = function(timestamp){
    if(isWalking)
        window.requestAnimationFrame(onframe);
    walker.walk();
    ++walker.age;
    counter.innerHTML = walker.age;
};

var init = function(evt){
    fullWidth = bkg.width = bkg.offsetWidth;
    fullHeight = bkg.height = bkg.offsetHeight;
    cols = Math.round(fullWidth/RECT_SIZE);
    rows = Math.round(fullHeight/RECT_SIZE);
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = fillStyle;
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
        ctx.fillStyle = fillStyle = '#'+e.target.value;
    });
});
var bgColorRadios = settings.querySelectorAll('input[name="bg-color"]');
Array.prototype.forEach.call(bgColorRadios, function(radio){
    radio.addEventListener('change', function(e){
        bkg.style.backgroundColor = '#'+e.target.value;
    });
});


init();
window.requestAnimationFrame(onframe);
