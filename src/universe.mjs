import { Constellation, mul, trans, scale, rx, ry, rz, perspective } from './scene.mjs';

const silver = [.91,.94,1];
const amber = [.95,.80,.57];
const mint = [.50,.90,.95];
const blue = [.72,.63,1];
const palette = [amber,mint,blue];

function pathGeometry(points) {
  return {p:points.flat(),n:points.flatMap(()=>[0,0,1])};
}

export class Universe extends Constellation {
  constructor(canvas, onShare, options={}) {
    super(canvas,onShare,options);
    if (!this.gl) return;
    this.rotationY=0;
    this.key=[];
    this.path=this.upload(pathGeometry(Array.from({length:100},(_,i)=>{
      const x=i/99*5-2.5;
      return [x,.2*x*x-.6,0];
    })));
    this.nodes=Array.from({length:24},(_,i)=>{
      const a=i*2.39996, r=1.1+Math.sqrt(i/24)*1.6;
      return [Math.cos(a)*r,Math.sin(a)*r,(i%5-2)*.42];
    });
    const edges=[];
    this.nodes.forEach((p,i)=>{
      [1,5].forEach(step=>{if(i+step<this.nodes.length) edges.push(p,this.nodes[i+step]);});
    });
    this.edges=this.upload(pathGeometry(edges));
    import('./key-asset.mjs').then(({default:parts})=>{
      this.key=parts.map(part=>({mesh:this.upload(part),color:part.color}));
    }).catch(()=>{canvas.setAttribute('aria-label','Key asset unavailable. Continue scrolling to explore the mathematical scenes.');});
  }

  solid(mesh, model, color, alpha=1) {
    this.draw(mesh,model,this.vp,color,alpha,3,this.gl.TRIANGLES,2,this.glowBoost);
  }

  ring(model,color,alpha=1) {
    this.draw(this.meshes.ring,model,this.vp,color,alpha,1,this.gl.LINE_STRIP);
  }

  station(index, model, time) {
    const sphere=(position,radius,color)=>this.solid(this.meshes.sphere,mul(model,mul(trans(...position),scale(radius,radius,radius))),color);
    if(index===0) {
      const keyModel=mul(model,mul(rz(-.37),ry(Math.sin(time*.22)*.28)));
      this.key.forEach(part=>this.solid(part.mesh,keyModel,part.color));
      for(let i=0;i<12;i++) {
        const x=((time*.55+i/12)%1)*2.7-.75;
        this.solid(this.meshes.sphere,mul(keyModel,mul(trans(x,0,.15),scale(.023,.023,.023))),amber);
      }
    } else if(index===1 || index===5) {
      const split=index===1 ? Math.min(1,Math.max(0,this.cameraOffset-.75)) : 1-Math.min(1,Math.max(0,this.cameraOffset-4.7));
      this.draw(this.path,mul(model,rz(.12)),this.vp,mint,.55,1,this.gl.LINE_STRIP);
      sphere([0,0,0],.24+(.45*(1-split)),silver);
      this.nodeCenters=[];
      for(let i=0;i<3;i++) {
        const angle=i*Math.PI*2/3+time*.11;
        const p=[Math.cos(angle)*(1.1+split),Math.sin(angle)*(1.1+split),.2];
        sphere(p,.18,palette[i]);
        for(let tail=0;tail<12;tail++){
          const t=((time*.25+i/3-tail*.014)%1+1)%1;
          sphere([p[0]*t,p[1]*t+Math.sin(t*Math.PI)*.45,p[2]*t],.035*(1-tail/15),palette[i]);
        }
        this.ring(mul(model,mul(trans(...p),scale(.18,.18,.18))),palette[i],.7);
        if(!this.cinematic){
          const screen=this.project(p,mul(this.vp,model));
          this.nodeCenters.push(screen);
          const tag=this.tags[i];
          if(tag){tag.style.left=screen.x+'px';tag.style.top=screen.y+'px';}
        }
      }
    } else if(index===2) {
      this.draw(this.edges,model,this.vp,blue,.34,1,this.gl.LINES);
      this.nodes.forEach((p,i)=>sphere(p,i%6===0?.12:.055,i%6===0?amber:blue));
      for(let i=0;i<12;i++) {
        const a=this.nodes[i],b=this.nodes[i+5], t=(time*.18+i*.17)%1;
        for(let tail=0;tail<9;tail++) {
          const phase=(t-tail*.012+1)%1;
          sphere(a.map((v,k)=>v+(b[k]-v)*phase),.038*(1-tail/11),tail<2?silver:mint);
        }
      }
    } else if(index===3) {
      for(let i=0;i<9;i++) {
        this.ring(mul(model,mul(trans(0,0,-i*.36),mul(rz(time*.13+i*.17),scale(1+i*.055,1+i*.055,1)))),i%2?blue:amber,.8);
      }
      for(let i=0;i<16;i++){
        const a=i*Math.PI/8;
        sphere([Math.cos(a)*1.55,Math.sin(a)*1.55,0],.045,mint);
        for(let tail=0;tail<6;tail++){
          const depth=-((time*1.3+i*.3-tail*.08)%4+4)%4;
          sphere([Math.cos(a)*1.55,Math.sin(a)*1.55,depth],.028*(1-tail/7),tail?blue:silver);
        }
      }
    } else if(index===4) {
      for(let i=0;i<8;i++) {
        const axis=mul(ry(time*.16+i*.35),rx(i*.4));
        this.ring(mul(model,mul(axis,scale(.6+i*.09,.6+i*.09,.6+i*.09))),i%2?mint:blue,.62);
      }
      sphere([0,0,0],.35,silver);
      this.draw(this.edges,mul(model,scale(.55,.55,.55)),this.vp,amber,.3,1,this.gl.LINES);
    } else {
      for(let i=0;i<4;i++) {
        const position=trans((i%2-.5)*2.6,(Math.floor(i/2)-.5)*1.65,0);
        const panel=mul(model,mul(position,ry(-.2)));
        this.ring(mul(panel,scale(.65,.4,1)),blue,.65);
        for(let bar=0;bar<7;bar++) {
          const height=.15+((bar*3+i)%7)/7*.6;
          this.solid(this.meshes.sphere,mul(panel,mul(trans((bar-3)*.2,-.35+height/2,0),scale(.045,height,.045))),i%2?mint:amber);
        }
      }
    }
  }

  frame(timestamp) {
    const gl=this.gl;
    if(!gl)return;
    const dt=Math.min(.05,(timestamp-this.last)/1000||.016);
    this.last=timestamp;
    if(this.visible && this.key) {
      if(this.autoRotate)this.time+=dt;
      this.cameraOffset+=(this.chapter-this.cameraOffset)*(1-Math.exp(-dt*6));
      const progress=this.cinematic?this.cameraOffset:1.7;
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.pr);
      gl.uniform1f(this.locs.time,this.time);
      const aspect=this.width/Math.max(1,this.height);
      const projection=perspective(Math.PI/3,aspect,.1,80);
      const cameraZ=this.distance-progress*11;
      this.vp=mul(projection,trans(0,0,-cameraZ));
      const interaction=mul(ry(this.rotationY),rx(this.rotationX*.4));
      if(this.cinematic) {
        for(let i=0;i<7;i++) {
          if(Math.abs(progress-i)>1.6)continue;
          const model=mul(trans(aspect<1?0:1.25,0,-i*11),interaction);
          this.station(i,model,this.time);
        }
      } else this.station(1,mul(trans(0,.25,-progress*11),interaction),this.time);
    }
    requestAnimationFrame(t=>this.frame(t));
  }
}

