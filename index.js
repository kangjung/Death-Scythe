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
        this.ctx = this.canvas.getContext('2d'); // 2d 컨텍스트를 저장한다
        this.scenes = [];
        this.now = 0;
        this.last = 0;
        this.timeDelta = 0;
    }

    update(){
        this.last = this.now;
        this.now = performance.now();
        this.timeDelta = (this.now-this.last)/1000;

        this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
        if( this.scenes.length > 0){
            this.scenes.last().update(this.timeDelta);
            this.scenes.last().render(this.ctx);
        }
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
        this.children.forEach((child)=>{ child.update(timeDelta); }); // 자녀 객체들의 업데이트를 호출
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
        this.character = new Character();
        this.character.init();
        this.children.push(this.character);
    }

    update(timeDelta){
        super.update(timeDelta);
        if( this.elapsed > 0.5 && this.character.pivot === null ){
            this.character.setPivot({x:240, y:0});
        }
    }

    render(ctx){
        super.render(ctx);
    }
}
class GameObject{
    init(){  }
    update(timeDelta) { }
    render(ctx){ }
}
class Character extends GameObject {
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
            this.accel = (-1.0 * (this.force.x+this.force.y)/this.pLen) * Math.sin(this.angle);
            this.update(0);
        }
    }

    update(timeDelta){
        if(this.pivot === null){
            this.force.y += this.gravity * timeDelta;
            this.x += this.force.x;
            this.y += this.force.y;
        }else{
            let ang = this.angle;
            let ang_vel = (-this.gravity/this.pLen) * Math.sin(ang);
            this.accel += ang_vel * timeDelta;
            this.accel *= 1;
            ang += this.accel;
            this.angle = ang;

            this.force.x = this.pLen * this.accel * Math.cos(ang);
            this.force.y = -this.pLen * this.accel * Math.sin(ang);

            this.position.x += this.force.x;
            this.position.y += this.force.y;
            this.x = this.position.x + this.pivot.x;
            this.y = this.position.y + this.pivot.y;
        }
    }

    render(ctx){
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, 5*Math.PI);
        ctx.fill();
        ctx.restore();
    }
}

const game = new Game(document.getElementById('canvas'));
game.push(new GameScene());
game.update();
