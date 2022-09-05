Array.prototype.last = function(){
    return (this.length>0)?this[this.length-1]:null;
}
Math.distance = function(p1, p2){
    return Math.abs(Math.sqrt(Math.pow(p2.x-p1.x,2) + Math.pow(p2.y-p1.y,2)));
}
Math.rad2deg = function(rad){
    return rad * 180 / Math.PI;
}
Math.deg2rad = function(deg){
    return deg / 180 * Math.PI;
}
Math.angle = function(p1,p2){
    let w = p2.x - p1.x;
    let h = p2.y - p1.y;
    return Math.atan2(-h,w) - Math.PI/2;
}
Math.getPoint = function(pt, deg, len){
    return {x:pt.x + (len*Math.cos(deg)), y:pt.y + (len*Math.sin(deg))};
}
class Game{
    constructor(gameCanvas){
        this.canvas = gameCanvas;
        this.ctx = this.canvas.getContext('2d');
        this.scenes = [];
        this.now = 0;
        this.last = 0;
        this.timeDelta = 0;
        this.click = false;
        document.addEventListener("click", this.clickCheck.bind(this), false);
    }

    clickCheck(){
        this.click = true;
    }

    update(){
        this.last = this.now;
        this.now = performance.now();
        this.timeDelta = (this.now-this.last)/1000;

        this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
        if( this.scenes.length > 0){
            this.scenes.last().update(this.timeDelta, this.click);
            this.scenes.last().render(this.ctx);
        }
        this.click = false;
        requestAnimationFrame(this.update.bind(this));
    }

    push(scene){
        if( this.scenes.length>0 ) {
            this.scenes.last().pause();
        }
        scene.init();
        this.scenes.push(scene);
    }
}

class Scene {
    constructor(){
        this.children = [];
        this.elapsed = 0;
    }

    init(){
    }

    update(timeDelta){
        this.elapsed += timeDelta;
        this.children.forEach((child)=>{ child.update(timeDelta); });
    }

    render(ctx){
        this.children.forEach((child)=>{ child.render(ctx); });
    }

    pause(){
    }
}

class GameScene extends Scene {
    constructor(){
        super();
        this.cameraX = 100;

        this.character = new Character();
        this.background = new Background();

        this.children.push(this.background);
        this.children.push(this.character);

        this.children.forEach((ch)=>{ ch.parent = this; });

    }

    init(){
        this.background.init();
        this.character.init();
        this.cameraX = 100;
    }

    update(timeDelta, click){
        this.elapsed += timeDelta;
        this.children.forEach((ch) => {
            ch.update(timeDelta, this.character);
        });

        if (this.elapsed < 0.5 && this.character.pivot === null) {
            this.character.setPivot({x: 240, y: 0});
        }

        this.cameraX = this.character.x;

        if (click) {
            let tx = Math.cos(Math.PI / 4) * this.character.y + this.character.x;
            this.character.setPivot({x: tx, y: 0});
        }
        if(this.cameraX % 1800 === 0){
            this.background.render(this.ctx);
        }

    }

    render(ctx){
        ctx.save();
        ctx.translate(-this.cameraX + 200, 0);
        super.render(ctx);
        ctx.restore();

    }
}
class GameObject{
    init(){  }
    update(timeDelta) { }
    render(ctx){ }
}
class Character extends GameObject {
    constructor(){
        super();
        this.img = new Image();
        this.img.src = "./image/player.png";
    }

    init(){
        this.x = 50;
        this.y = 50;
        this.gravity = 10;
        this.pivot = null;
        this.position = null;
        this.force = {x:0,y:0};
        this.pLen = 0;
        this.angle = 0;
        this.accel = 0;
    }

    setPivot(point){
        if( this.pivot === null ){
            this.pivot = point;
            this.pLen = Math.distance(this, this.pivot);
            this.position = {x:this.x - this.pivot.x, y:this.y - this.pivot.y};
            this.angle = Math.angle({x:this.x, y:this.y}, this.pivot);
            this.accel = (-1.5 * (this.force.x+this.force.y)/this.pLen) * Math.sin(this.angle);
            this.update(0);
        }else{
            this.pivot = null;
            this.pLen = 0;
            this.position = null;
            this.angle = 0;
            this.accel = 0;
            this.update(0);
        }
    }

    update(timeDelta){
        if(this.pivot === null){
            this.force.y += this.gravity * timeDelta;
            this.force.x *= 0.99;
            this.x += this.force.x;
            this.y += this.force.y;
            this.rotation += -360 * timeDelta;
        }else {
            let ang = this.angle;
            let ang_vel = (-1 * (this.gravity / this.pLen)) * Math.sin(ang);
            this.accel += ang_vel * timeDelta;
            //this.accel *= 0.999;
            ang += this.accel;
            if (Math.abs(Math.rad2deg(ang)) >= 90) {
                this.setPivot(null);
            } else {
                this.angle = ang;

                this.force.x = this.pLen * this.accel * Math.cos(ang);
                this.force.y = -this.pLen * this.accel * Math.sin(ang);

                this.position.x += this.force.x;
                this.position.y += this.force.y;
                this.x = this.position.x + this.pivot.x;
                this.y = this.position.y + this.pivot.y;


            }
        }
        this.magnet = Math.max(0, this.magnet - timeDelta);
    }

    render(ctx){
        ctx.save();
        if (this.pivot !== null) {
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.moveTo(this.pivot.x, this.pivot.y);
            ctx.lineTo(this.pivot.x + this.position.x, this.pivot.y + this.position.y);
            ctx.stroke();
        }
        ctx.restore();
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, 5*Math.PI);
        ctx.fill();
        ctx.drawImage(this.img, 0, 0,64,64);
        ctx.restore();
    }
}

class Background extends GameObject{
    constructor(){
        super();
        let imageUrls = ["./image/background.png","./image/background.png","./image/background.png"];
        this.images = [];
        this.images = imageUrls.map((v)=>{ let img = new Image(); img.src = v; return img; });
    }

    update(timeDelta) {


    }

    render(ctx){
        let x = this.parent.cameraX - 200;

        ctx.save();
        ctx.translate(x, 0);
        let backgroundX = -(x/2) % 1800;
        ctx.drawImage(this.images[0], backgroundX, 0);
        ctx.drawImage(this.images[1], backgroundX + 1800, 0);
        ctx.restore();
    }
}


const game = new Game(document.getElementById('canvas'));
game.push(new GameScene());
game.update();
