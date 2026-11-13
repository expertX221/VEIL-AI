const ident = () => new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o}
const trans=(x=0,y=0,z=0)=>{const a=ident();a[12]=x;a[13]=y;a[14]=z;return a};
const scale=(x=1,y=1,z=1)=>{const a=ident();a[0]=x;a[5]=y;a[10]=z;return a};
const rx=(t)=>{const a=ident(),c=Math.cos(t),s=Math.sin(t);a[5]=c;a[9]=-s;a[6]=s;a[10]=c;return a};
const ry=(t)=>{const a=ident(),c=Math.cos(t),s=Math.sin(t);a[0]=c;a[8]=s;a[2]=-s;a[10]=c;return a};
const rz=(t)=>{const a=ident(),c=Math.cos(t),s=Math.sin(t);a[0]=c;a[4]=-s;a[1]=s;a[5]=c;return a};
function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),o=new Float32Array(16);o[0]=f/aspect;o[5]=f;o[10]=(far+near)/(near-far);o[11]=-1;o[14]=2*far*near/(near-far);return o}
function makeSphere(lat=35,lon=48){const p=[],n=[],idx=[];for(let y=0;y<=lat;y++){const v=y/lat,theta=v*Math.PI;for(let x=0;x<=lon;x++){const u=x/lon,phi=u*Math.PI*2;const px=Math.sin(theta)*Math.cos(phi),py=Math.cos(theta),pz=Math.sin(theta)*Math.sin(phi);p.push(px,py,pz);n.push(px,py,pz)}}for(let y=0;y<lat;y++)for(let x=0;x<lon;x++){const a=y*(lon+1)+x,b=a+lon+1;idx.push(a,b,a+1,b,b+1,a+1)}return{p,n,idx}}
function makeOctahedron(){const verts=[[0,1,0],[1,0,0],[0,0,1],[-1,0,0],[0,0,-1],[0,-1,0]];const faces=[[0,2,1],[0,3,2],[0,4,3],[0,1,4],[5,1,2],[5,2,3],[5,3,4],[5,4,1]];const p=[],n=[];for(const face of faces){const a=verts[face[0]],b=verts[face[1]],c=verts[face[2]],u=b.map((v,i)=>v-a[i]),v=c.map((q,i)=>q-a[i]);const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];for(const ix of face){p.push(...verts[ix]);n.push(...normal)}}return{p,n}}
function makeRing(radius=1.55,segments=128){const p=[],n=[];for(let i=0;i<=segments;i++){const t=i/segments*Math.PI*2;p.push(Math.cos(t)*radius,Math.sin(t)*radius,0);n.push(0,0,1)}return{p,n}}
function makeParticles(){const p=[],n=[];for(let i=0;i<220;i++){const angle=Math.random()*Math.PI*2,dist=2.1+Math.random()*3.4,y=(Math.random()-.5)*5;p.push(Math.cos(angle)*dist,y,Math.sin(angle)*dist);n.push(0,0,1)}return{p,n}}
function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
function program(gl){
  const vert=`attribute vec3 aPosition;attribute vec3 aNormal;uniform mat4 uMVP;uniform mat4 uModel;uniform float uPointSize;varying vec3 vNormal;varying vec3 vPosition;void main(){gl_Position=uMVP*vec4(aPosition,1.);gl_PointSize=uPointSize;vNormal=normalize(mat3(uModel)*aNormal);vPosition=aPosition;}`;
  const frag=`precision mediump float;uniform vec3 uColor;uniform float uAlpha;uniform float uTime;uniform float uStyle;uniform float uBoost;varying vec3 vNormal;varying vec3 vPosition;void main(){if(uStyle>1.5&&uStyle<2.5){vec2 p=gl_PointCoord-vec2(.5);if(length(p)>.5)discard;float a=(1.-length(p)*2.)*.7;gl_FragColor=vec4(uColor,a*uAlpha*uBoost);return;}if(uStyle>.5&&uStyle<1.5){gl_FragColor=vec4(uColor,uAlpha*uBoost);return;}float lambert=max(.12,dot(normalize(vNormal),normalize(vec3(.1,.5,1.))));float edge=pow(1.-abs(dot(normalize(vNormal),vec3(0.,0.,1.))),2.);float scan=.5+.5*sin(vPosition.y*16.+uTime*1.2);float highlight=pow(max(0.,dot(reflect(-normalize(vec3(.1,.5,1.)),normalize(vNormal)),vec3(0.,0.,1.))),24.);vec3 body=uColor*(.18+.72*lambert)+uColor*scan*.1*uBoost+vec3(.18,.65,.96)*edge*.45*uBoost;if(uStyle>2.5)body=uColor*(.22+lambert*.95)+vec3(.38,.65,.9)*edge*.25*uBoost;gl_FragColor=vec4(body+vec3(.7,.9,1.)*highlight*.65,uAlpha);}`;
  const prog=gl.createProgram();gl.attachShader(prog,shader(gl,gl.VERTEX_SHADER,vert));gl.attachShader(prog,shader(gl,gl.FRAGMENT_SHADER,frag));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(prog));return prog;
}

const THEMES = {
  balanced:{core:[.11,.58,.79],inner:[.47,.84,.95],rings:[[.24,.77,.86],[.67,.52,.98],[.25,.83,.91]],selected:[.38,.87,.84],idle:[.38,.53,.69],particles:[.38,.75,.96]},
  defense:{core:[.08,.46,.82],inner:[.38,.92,.78],rings:[[.15,.83,.76],[.22,.67,.93],[.39,.87,.77]],selected:[.33,.97,.73],idle:[.27,.52,.68],particles:[.22,.83,.88]},
  alert:{core:[.32,.33,.78],inner:[.94,.46,.86],rings:[[.97,.33,.69],[.71,.45,.99],[.23,.84,.96]],selected:[1,.53,.84],idle:[.5,.47,.77],particles:[.95,.5,.9]}
};

export class Constellation{
  constructor(canvas,onShard,{cinematic=false}={}){
    this.cinematic=cinematic;this.chapter=0;this.cameraOffset=0;this.visible=true;this.canvas=canvas;this.onShard=onShard;this.tags=[1,2,3].map(i=>document.getElementById(`node-${i}`));
    this.selected=[1,2];this.rotationX=-.22;this.rotationY=.4;this.distance=7.4;this.pressed=false;this.dragged=false;this.time=0;this.last=0;
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.nodeCenters=[];this.positions=[[2.45,.78,.3],[-2.3,-.77,.3],[.15,2.09,-.55]];
    this.autoRotate=true;this.showRings=true;this.showParticles=true;this.glowBoost=1.1;this.mode='balanced';this.flash=0;
    this.gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
    if(!this.gl){this.fallback();return}
    const gl=this.gl;
    try{this.pr=program(gl)}catch(e){console.error(e);this.fallback();return}
    this.locs={pos:gl.getAttribLocation(this.pr,'aPosition'),normal:gl.getAttribLocation(this.pr,'aNormal'),mvp:gl.getUniformLocation(this.pr,'uMVP'),model:gl.getUniformLocation(this.pr,'uModel'),color:gl.getUniformLocation(this.pr,'uColor'),alpha:gl.getUniformLocation(this.pr,'uAlpha'),style:gl.getUniformLocation(this.pr,'uStyle'),time:gl.getUniformLocation(this.pr,'uTime'),pointSize:gl.getUniformLocation(this.pr,'uPointSize'),boost:gl.getUniformLocation(this.pr,'uBoost')};
    this.meshes={sphere:this.upload(makeSphere()),crystal:this.upload(makeOctahedron()),ring:this.upload(makeRing()),particles:this.upload(makeParticles())};
    gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    this.installEvents();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();const visibility=new IntersectionObserver(([entry])=>{this.visible=entry.isIntersecting});visibility.observe(canvas);requestAnimationFrame(t=>this.frame(t));
  }
  fallback(){const c=this.canvas,ctx=c.getContext('2d');if(!ctx)return;const draw=()=>{c.width=c.clientWidth*devicePixelRatio;c.height=c.clientHeight*devicePixelRatio;const w=c.width,h=c.height;ctx.clearRect(0,0,w,h);const g=ctx.createRadialGradient(w/2,h*.46,10,w/2,h*.46,w*.3);g.addColorStop(0,'#316b89aa');g.addColorStop(1,'#06213a00');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.beginPath();ctx.arc(w/2,h*.46,Math.min(w,h)*.24,0,Math.PI*2);ctx.strokeStyle='#80dce9';ctx.lineWidth=3;ctx.stroke()};draw();window.addEventListener('resize',draw)}
  upload(data){const gl=this.gl,m={count:data.p.length/3,indexed:!!data.idx};m.pos=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,m.pos);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.p),gl.STATIC_DRAW);m.norm=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,m.norm);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.n),gl.STATIC_DRAW);if(data.idx){m.idx=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.idx);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(data.idx),gl.STATIC_DRAW);m.count=data.idx.length}return m}
  resize(){const dpr=Math.min(window.devicePixelRatio||1,2),rect=this.canvas.getBoundingClientRect();this.width=rect.width;this.height=rect.height;this.canvas.width=Math.floor(rect.width*dpr);this.canvas.height=Math.floor(rect.height*dpr);this.gl.viewport(0,0,this.canvas.width,this.canvas.height)}
  installEvents(){const c=this.canvas;c.addEventListener('pointerdown',e=>{this.pressed=true;this.dragged=false;this.lastX=e.clientX;this.lastY=e.clientY;c.setPointerCapture(e.pointerId)});c.addEventListener('pointermove',e=>{if(!this.pressed)return;const dx=e.clientX-this.lastX,dy=e.clientY-this.lastY;if(Math.abs(dx)+Math.abs(dy)>1)this.dragged=true;this.rotationY+=dx*.008;this.rotationX=Math.max(-1.3,Math.min(1.3,this.rotationX+dy*.007));this.lastX=e.clientX;this.lastY=e.clientY});c.addEventListener('pointerup',e=>{if(!this.pressed)return;this.pressed=false;if(!this.dragged){const r=c.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let nearest=-1,d=45;this.nodeCenters.forEach((p,i)=>{const di=Math.hypot(p.x-x,p.y-y);if(di<d){d=di;nearest=i}});if(nearest>=0)this.onShard(nearest+1);else if(Math.hypot(x-this.width/2,y-this.height/2)<125)this.distance=this.distance>6.7?6.1:7.4}});c.addEventListener('pointercancel',()=>{this.pressed=false});c.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();this.distance=Math.min(10.8,Math.max(5.3,this.distance+Math.sign(e.deltaY)*.35))},{passive:false})}
  setChapter(index){this.chapter=index;}
  setSelected(selected){this.selected=selected}
  setAutoRotate(v){this.autoRotate=!!v}
  setShowRings(v){this.showRings=!!v}
  setShowParticles(v){this.showParticles=!!v}
  setGlowBoost(v){this.glowBoost=Math.max(.6,Math.min(1.9,v))}
  setMode(mode){this.mode=THEMES[mode]?mode:'balanced'}
  flashCore(){this.flash=1}
  resetCamera(){this.rotationX=-.22;this.rotationY=.4;this.distance=7.4}
  matScene(){const aspect=this.width/Math.max(1,this.height),adapt=aspect<1.25?.78:1;return mul(ry(this.rotationY),mul(rx(this.rotationX),scale(adapt,adapt,adapt)))}
  project(pos,m){const x=pos[0],y=pos[1],z=pos[2],w=m[3]*x+m[7]*y+m[11]*z+m[15],px=(m[0]*x+m[4]*y+m[8]*z+m[12])/w,py=(m[1]*x+m[5]*y+m[9]*z+m[13])/w,pz=(m[2]*x+m[6]*y+m[10]*z+m[14])/w;return{x:(px*.5+.5)*this.width,y:(1-(py*.5+.5))*this.height,z:pz}}
  draw(mesh,model,vp,color,alpha,style,primitive,pointSize=2,boost=this.glowBoost){const gl=this.gl,loc=this.locs;gl.bindBuffer(gl.ARRAY_BUFFER,mesh.pos);gl.enableVertexAttribArray(loc.pos);gl.vertexAttribPointer(loc.pos,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,mesh.norm);gl.enableVertexAttribArray(loc.normal);gl.vertexAttribPointer(loc.normal,3,gl.FLOAT,false,0,0);gl.uniformMatrix4fv(loc.model,false,model);gl.uniformMatrix4fv(loc.mvp,false,mul(vp,model));gl.uniform3fv(loc.color,color);gl.uniform1f(loc.alpha,alpha);gl.uniform1f(loc.style,style);gl.uniform1f(loc.pointSize,pointSize*(window.devicePixelRatio||1));gl.uniform1f(loc.boost,boost);if(mesh.indexed){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.idx);gl.drawElements(primitive,mesh.count,gl.UNSIGNED_SHORT,0)}else gl.drawArrays(primitive,0,mesh.count)}
  frame(timestamp){const gl=this.gl;if(!gl)return;const dt=Math.min(.06,(timestamp-this.last)/1000||.016);this.last=timestamp;if(!this.visible){requestAnimationFrame(t=>this.frame(t));return}if(!this.reduced&&!this.pressed&&this.autoRotate)this.rotationY+=dt*.065;if(!this.reduced&&this.autoRotate)this.time+=dt;this.cameraOffset+=(this.chapter-this.cameraOffset)*(1-Math.exp(-dt*4));this.flash=Math.max(0,this.flash-dt*1.8);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.pr);gl.uniform1f(this.locs.time,this.time);
    const theme=THEMES[this.mode]||THEMES.balanced;const flashBoost=1+this.flash*.75;const aspect=this.width/Math.max(this.height,1),proj=perspective(Math.PI/3.05,aspect,.1,50),view=trans(0,0,-this.distance+(this.reduced?0:this.cameraOffset*.48)),scene=this.matScene(),vp=mul(proj,view);this.mvp=mul(vp,scene);
    if(this.showParticles) this.draw(this.meshes.particles,scene,vp,theme.particles,.54,2,gl.POINTS,2.2,flashBoost*.95);
    if(this.showRings){gl.depthMask(false);for(let r=0;r<3;r++){const ringRot=mul(scene,mul(ry(this.time*(r%2?.11:-.08)+r*.9),mul(rx(r*.6+.36),scale(1+r*.14,1+r*.14,1+r*.14))));this.draw(this.meshes.ring,ringRot,vp,theme.rings[r],r===1?.35:.4,1,gl.LINE_STRIP,2,flashBoost)}gl.depthMask(true)}
    if(this.cinematic && (this.chapter<.5 || this.chapter>1.5)){
      const review=this.chapter>1.5;
      const spread=Math.max(0,Math.min(1,(this.distance-6.1)/3.1));
      for(let i=0;i<5;i++){
        const phase=i*Math.PI*2/5;
        const spacing=spread*(review?1.6:1.15);
        const orbit=mul(scene,ry(this.time*.28));
        const model=mul(orbit,mul(trans(Math.cos(phase)*spacing,(i-2)*(.23+spread*.16),Math.sin(phase)*spacing),mul(rx(review?.15:Math.PI/2),scale(.84+i*.055,.84+i*.055,1))));
        this.draw(this.meshes.ring,model,vp,theme.rings[i%3],.83,1,gl.LINE_STRIP,2,flashBoost);
        if(review){
          const panel=mul(orbit,mul(trans(Math.cos(phase)*spacing,(i-2)*.34,Math.sin(phase)*spacing),scale(.72,.24,.045)));
          this.draw(this.meshes.crystal,panel,vp,theme.rings[i%3],.83,3,gl.TRIANGLES,2,flashBoost);
        }
      }
      if(!review){
        const capsule=mul(scene,mul(ry(this.time*.32),scale(.72,1.24,.72)));
        this.draw(this.meshes.sphere,capsule,vp,theme.inner,.97,3,gl.TRIANGLES,2,flashBoost);
      }
      requestAnimationFrame(t=>this.frame(t));
      return;
    }
    const split=this.cinematic?Math.max(0,1-Math.abs(this.cameraOffset-1)):0;const core=mul(scene,mul(rz(.17),mul(ry(this.time*.42+this.cameraOffset*.55),scale(1.03-split*.62,1.85-split*1.15,1.03-split*.62))));this.draw(this.meshes.crystal,core,vp,theme.inner,.96,3,gl.TRIANGLES,2,flashBoost);

    this.nodeCenters=[];
    this.positions.forEach((v,i)=>{const rot=mul(rz(this.time*.08+i),ry(this.time*.16+i)),bob=Math.sin(this.time*1.3+i)*.1,model=mul(scene,mul(trans(v[0],v[1]+bob,v[2]),mul(rot,scale(.43+split*.22,.6+split*.32,.43+split*.22))));const bright=this.cinematic?i<2:this.selected.includes(i+1);this.draw(this.meshes.crystal,model,vp,bright?theme.selected:theme.idle,bright?.98:.68,3,gl.TRIANGLES,2,flashBoost*(bright?1.08:1));const p=this.project([v[0],v[1]+bob,v[2]],this.mvp);this.nodeCenters.push(p);const tag=this.cinematic?null:this.tags[i];if(!tag)return;tag.style.left=`${p.x}px`;tag.style.top=`${p.y-30}px`;tag.style.opacity=p.z<1?'1':'.25'});
    requestAnimationFrame(t=>this.frame(t));
  }
}



