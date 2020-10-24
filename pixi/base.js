async function init() {
    console.log("init() successfully called.");	

    let app = new PIXI.Application({ 
        width: 200,         // default: 800
        height: 200,        // default: 600
        antialias: false,    // default: false
        transparent: false, // default: false
        resolution: 1       // default: 1
      }
    );
    appref = app

    app.renderer.backgroundColor = 0x061639;
    app.view.classList.add("noblur")
    app.view.style.width = "800px"
    app.view.style.height = "800px"

    let farTex = getTexture("resources/test_bg.png")
    far = new PIXI.Sprite(farTex);
    far.setpos(-90,-120);
    far.zindex = -1
    app.stage.addChild(far);
    
    let plyTex = getTexture("resources/characters/setzer/side.png")
    plySprite = new PIXI.Sprite(plyTex);
    plySprite.setpos(30,150);
    plySprite.scale.x = -1
    app.stage.addChild(plySprite);
    
    let enemyTex = getTexture("resources/test_enemy.png")
    enemy = new PIXI.Sprite(enemyTex);
    enemy.setpos(140,100);
    app.stage.addChild(enemy);
    enemy2 = new PIXI.Sprite(enemyTex);
    enemy2.setpos(160,140);
    app.stage.addChild(enemy2);
    
    enemy.interactive = true
    enemy.on("mouseover", addHover).on("mouseout", removeHover)
    enemy2.interactive = true
    enemy2.on("mouseover", addHover).on("mouseout", removeHover)

    document.body.appendChild(app.view);

    await sleep(1000);

    plySprite.interactive = true
    plySprite
        .on('mousedown', onDownPlayer)
        .on('touchstart', onDownPlayer)
        .on('mouseup', onUpPlayer)
        .on('mouseupoutside', onUpPlayer)
        .on('touchend', onUpPlayer)
        .on('touchendoutside', onUpPlayer)
        .on('mousemove', onDragMovePlayer)
        .on('touchmove', onDragMovePlayer)
    
    init_players()

    ply = new Player(plySprite, static_setzer)
    ply.setHome(30,150)

    //ply.sprite.arcTo(100,120,30)
    //await ply.playAnimation("walk")
    //await ply.playAnimation("attack.sword")
    
    /*while(true){
        actionply.sprite.arcTo(100,120,30)
        await actionply.playAnimation("attack.sword")
        await actionply.playAnimation("walk")

        actionply.sprite.arcTo(150,120,30)
        await actionply.playAnimation("attack.sword")
        await actionply.playAnimation("walk")
    }*/
}

color = {
    selectorTop: 0xbc3e44,
    selectorBack: 0x510f20
}
layers = {}

hoverObjects = []
clickedObject = undefined
selectedObject = undefined

function addHover() {
    hoverObjects.push(this)
}
function removeHover() {
    let index = hoverObjects.indexOf(this);
    if(index !== -1) {
        hoverObjects.splice(index, 1);
    }
}
function onDownPlayer (eventData) {   
    if(this.WXPlayerParent == undefined){

    } else {
        console.log("CLICKED");
        let ply = this.WXPlayerParent
        ply.selector = new Selector(new PIXI.Graphics())
        let ringSprite = ply.selector.originGfx

        selectedObject = ringSprite
        clickedObject = ply

        let plyW = ply.sprite.width
        let plyH = ply.sprite.height

        ply.sprite.drawSelectorRing(ringSprite)

        appref.stage.addChild(ringSprite);
    }
}
async function onUpPlayer (event) {
    if(!(clickedObject instanceof Player)) return;

    let ringSprite = this.WXPlayerParent.selector.originGfx
    let lineSprite = this.WXPlayerParent.selector.line
    appref.stage.removeChild(lineSprite)
    appref.stage.removeChild(ringSprite)
    console.log("DROPPED");
    
    if(/*doattack*/ hoverObjects.length > 0){
        desinationFoot = hoverObjects[0].getFootPosition()

        size = clickedObject.sprite.getRealSize()
        destX = desinationFoot.x-size.width
        destY = desinationFoot.y-size.height+2

        clickedObject.sprite.arcTo(destX, destY, 30)
        await clickedObject.playAnimation("attack.sword")
    }

    hoverObjects = []
    selectedObject = undefined
    clickedObject = undefined
}
function onDragMovePlayer(event) {
    if(clickedObject == undefined) return;
    if(!(clickedObject instanceof Player)) return;
    
    srcPos = clickedObject.sprite.position
    mousePos = event.data.global //bad syntax but gets mouse location

    if(clickedObject.selector.line == undefined){        
        clickedObject.selector.line = new PIXI.Graphics()
        appref.stage.addChild(clickedObject.selector.line)
    }
    let selectorLine = clickedObject.selector.line;
    selectorLine.clear()

    let destX = mousePos.x
    let destY = mousePos.y

    let footPosition = clickedObject.sprite.getFootPosition()
    cx = footPosition.x
    cy = footPosition.y

    if(hoverObjects.length > 0){
        //todo pick closet entity
        hoverObjects[0].drawSelectorRing(selectorLine)
        let footPosition = hoverObjects[0].getFootPosition()
        destX = footPosition.x
        destY = footPosition.y
    }
    
    //let slope = (cy-destY)/(cx-destX)
    //let radius = clickedObject.sprite.width/2
    //desiredX = Math.sign(destX-srcPos.x)* radius/Math.sqrt(1+slope**2)
    //selectorLine.moveTo(cx + desiredX, cy + slope*desiredX/2)

    //selectorLine.lineStyle(3,color.selectorBack) 
    //selectorLine.moveTo(cx + desiredX, cy + slope*desiredX/1.9)
    //selectorLine.lineTo(cx,cy)

    selectorLine.lineStyle(3,color.selectorTop) 
    selectorLine.moveTo(cx, cy)
    selectorLine.lineTo(destX,destY)

    selectorLine.beginHole()
    selectorLine.lineTo(destX,destY)
    let radius = clickedObject.sprite.width/2
    //selectorLine.drawEllipse(cx,cy,radius,radius/2)
}

PIXI.Sprite.prototype.getFootPosition = function(){
    let center = this.getCenter()
    let realSize = this.getRealSize()
    let footX = center.x
    let footY = center.y+realSize.height/2-(realSize.width)/6+1
    return {x:footX, y:footY}
}
PIXI.Sprite.prototype.drawSelectorRing = function(selectorSprite){
    let footPosition = this.getFootPosition()
    let realSize = this.getRealSize()

    let centerX = footPosition.x
    let centerY = footPosition.y
    let widthRadius = realSize.width/2+2
    let heightRadius = widthRadius/2
    //console.log([centerX, centerY])

    selectorSprite.lineStyle(3,color.selectorBack)
    selectorSprite.drawEllipse(centerX, centerY, widthRadius, heightRadius)
    selectorSprite.lineStyle(3,color.selectorTop)
    selectorSprite.drawEllipse(centerX, centerY-1, widthRadius, heightRadius)
    selectorSprite.endFill()
}

PIXI.Sprite.prototype.setpos = function(nx,ny){
    this.x = nx;
    this.y = ny;
}
PIXI.Sprite.prototype.getCenter = function(){    
    let centerX = this.position.x+this.scale.x*this.width/2
    let centerY = this.position.y+this.scale.y*this.height/2
    return {x:centerX, y:centerY}
}
PIXI.Sprite.prototype.getRealSize = function(){    
    let realWidth = this.width+this.scale.x
    let realHeight = this.height+this.scale.y
    return {width:realWidth, height:realHeight}
}

function getSelectorRadius(sprite) {
    return (sprite.width)/2+4
}

function getTexture(path){
    var farTexture = PIXI.Texture.from(path);
    farTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    return farTexture
}

class Selector{
    constructor(graphics){
        this.originGfx = graphics
    }
}
class PoseKey {
    constructor(string) {
        this.name = string
    }
}
class TimedPose {
    constructor(frames, args){
        if(args.pose != undefined){
            this.pose = args.pose;
        }
        if(args.function != undefined){
            this.function = args.function;
        }
        if(args.awaitFunction != undefined){
            this.awaitFunction = args.awaitFunction;
        }
        this.nframes = frames;
    }    
}
class StaticPlayer {
    constructor(name,poseTable){
        this.name = {...name}
        this.poseTable = {...poseTable}
        this.poseSequences = {}
    }
    addAnimation(animationName, poseList) {
        this.poseSequences[animationName] = poseList
    }
}
class Player {
    constructor(sprite, staticPlayer){
        this.sprite = sprite;
        this.sprite.WXPlayerParent = this
        this.staticPlayer = staticPlayer;
    }
    setHome(x,y){
        this.sprite.setpos(x,y)
        this.homeX = x
        this.homeY = y
    }
    arcHome(){
        this.sprite.arcTo(this.homeX,this.homeY,20)
    }
    async playAnimation(animationName){
        this.TEMP = {}
        this.TEMP.poseSequence = [...this.staticPlayer.poseSequences[animationName]]
        if(this.TEMP.poseSequence == undefined) {
            console.log(`Animation ${animationName} does not exist`);
            return;
        }
        while(this.TEMP.poseSequence.length >= 1){
            this.TEMP.poppedPose = this.TEMP.poseSequence.shift()
            if(this.TEMP.poppedPose.pose != undefined){
                this.sprite.texture = this.staticPlayer.poseTable[this.TEMP.poppedPose.pose.name];
            }
            if(this.TEMP.poppedPose.function != undefined){
                this.TEMP.poppedPose.function.call(this)
            }
            if(this.TEMP.poppedPose.awaitFunction != undefined){
                await this.TEMP.poppedPose.awaitFunction.call(this)
            }
            await sleep(this.TEMP.poppedPose.nframes*1000/60);
        }
        delete this.TEMP
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

PIXI.ObservablePoint.prototype.add = function(pos) {
    this.x += pos.x
    this.y += pos.y
}
PIXI.ObservablePoint.prototype.set = function(pos) {
    this.x = pos.x
    this.y = pos.y
}
PIXI.ObservablePoint.prototype.setf = function(x,y) {
    this.x = x
    this.y = y
}
PIXI.Sprite.prototype.arcTo = async function(newX,newY,nframes) {
    let oldX = this.position.x
    let oldY = this.position.y
    let p = newX-oldX
    let q = newY-oldY

    let heightAboveBase = Math.max(10,Math.abs(p/4))
    let h = Math.min(newY-heightAboveBase,oldY-heightAboveBase)-oldY

    let root = Math.sqrt((h**2)*(p**2)-h*(p**2)*q)
    let b1 = -2*(h*p+root)/q
    let b2 = -2*(h*p-root)/q
    let b = Math.abs(b1+p) < Math.abs(b2+p) ? b1 : b2
    let a = -4*h/b**2

    let t = 0.0
    while(t < nframes){
        let x = (p*(t/nframes))
        let y = a*x*(x+b)
        this.setpos(oldX+x,oldY+y)
        t++
        await sleep(1000/60);  
    }
    this.setpos(newX,newY);
    // y(x) = a(x²+bx)
    // dY = a((Dx)²+bDx)
    // dy/a = (Dx)²+bDx
    // dy/a-(Dx)² = b
}

Player.prototype.slashSword = async function() {
    sword = new PIXI.Sprite(testSwordTex);
    this.slashItem(sword)
    await sleep(1000/30);  
    sword2 = new PIXI.Sprite(testSwordTex);
    sword2.alpha = 0.5
    this.slashItem(sword2)
    await sleep(1000/30);  
    sword3 = new PIXI.Sprite(testSwordTex);
    sword3.alpha = 0.5
    this.slashItem(sword3)
}

testSwordTex = getTexture("resources/test_sword.png")
Player.prototype.slashItem = async function(item){
    parentSprite = this.sprite
    item.setpos(parentSprite.position.x-10,parentSprite.position.y+20);
    item.angle = 200
    let scale = 0;
    item.scale.setf(scale,scale);

    appref.stage.addChild(item);

    while (item.angle > 10) {
        if(item.angle > 200 && item.angle < 330){
            scale = Math.min(scale+0.2,1)
        } else {
            scale = Math.max(scale-0.2,0)
        }
        item.scale.setf(scale,scale);
        item.angle = (item.angle+10)%360
        await sleep(1000/60);        
    }
    appref.stage.removeChild(item)
}


function init_players(){
    static_setzer = new StaticPlayer("setzer",{
        "side":getTexture("resources/characters/setzer/side.png"),
        "side.move":getTexture("resources/characters/setzer/side_move1.png"),
        "side.move2":getTexture("resources/characters/setzer/side_move2.png"),
        "side.move3":getTexture("resources/characters/setzer/side_move3.png"),
        "side.move4":getTexture("resources/characters/setzer/side_move4.png"),
        "side.jump":getTexture("resources/characters/setzer/side_carry2.png"),
        "side.fall":getTexture("resources/characters/setzer/side_pushed1.png"),
        "side.land":getTexture("resources/characters/setzer/side_kneel.png"),
        "side.dash":getTexture("resources/characters/setzer/side_dash.png")
    });
    static_setzer.addAnimation("attack.sword",[
        new TimedPose(12,{pose:new PoseKey("side.move")}),
        new TimedPose(12,{pose:new PoseKey("side.fall")}),
        new TimedPose(10,{pose:new PoseKey("side.land")}),
        new TimedPose(16,{pose:new PoseKey("side.dash"), awaitFunction:Player.prototype.slashSword}),
        new TimedPose(6,{pose:new PoseKey("side.move")}),
        new TimedPose(20,{function:Player.prototype.arcHome}),
        new TimedPose(20,{pose:new PoseKey("side")})
    ]);
    static_setzer.addAnimation("swipe.sword",[
        new TimedPose(20,{pose:new PoseKey("side.dash"), function:Player.prototype.slashSword}),
        new TimedPose(20,{pose:new PoseKey("side")})
    ]);

    static_setzer.addAnimation("walk",[
        new TimedPose(6,{pose:new PoseKey("side")}),
        new TimedPose(6,{pose:new PoseKey("side.move")}),
        new TimedPose(6,{pose:new PoseKey("side")}),
        new TimedPose(6,{pose:new PoseKey("side.move3")})
    ]);
}
