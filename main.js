const waitLoad = (element) => new Promise((resolve)=>{
  element.onload = resolve;
});
function *range(n) {
  for(let i = 0; i !== n; i++) {
    yield i;
  }
}
function *enumerate(arr){
  let i = 0;
  for(const v of arr) {
    yield [i,v];
    i++;
  }
}
const getColorFromImageData = (imageData, x, y) => {
  const { width, data } = imageData;
  const index = (x + y * width) * 4;
  return {
    r: data[index],
    g: data[index+1],
    b: data[index+2],
    a: data[index+3],
  };
};
const colorToCode = rgb => {
  const r = rgb.r.toString(16).padStart(2,0);
  const g = rgb.g.toString(16).padStart(2,0);
  const b = rgb.b.toString(16).padStart(2,0);
  const a = rgb.a.toString(16).padStart(2,0);
  return "#"+r+g+b+a;
};
const colorToHex = rgb => {
  return rgb.r *256*256 + rgb.g*256 + rgb.b;
};
function getSideData(imageData){
  const result = [];
  for(const iy of range(51)){
    const yResult = [];
    const y = Math.floor(331 + 6.4 * iy);
    for(const ix of range(150)){
      const x = Math.floor(48 + 10.641 * ix);
      const color = getColorFromImageData(imageData, x,y);
      yResult.push(color);
    }
    result.push(yResult);
  }
  return result;
}
function getBaseData(imageData, basex, basey) {
  const result = [];
  for(const iy of range(48)){
    const y = Math.floor(basey + 6.4 * iy);
    const resultY = [];
    for(const ix of range(48)){
      const x = Math.floor(basex + 10.641 * ix);
      const color = getColorFromImageData(imageData, x,y);
      if(color.r===255 && color.g===255 && color.b === 255) {
        color.r = color.g = color.b = 0;
      }
      resultY.push(color);
    }
    result.push(resultY);
  }
  return result;
}
const deg2rad = (deg) => deg * (Math.PI / 180);
const url = document.getElementById("url").textContent;

const $lastUpdate = document.getElementById("last-update");

function createSphere() {
  const geometry = new THREE.SphereGeometry( 15, 5, 5 ); 
  const material = new THREE.MeshBasicMaterial( { color: 0xffffff } ); 
  const mesh = new THREE.Mesh( geometry, material );
  return {
    mesh,
  };
}
function createCube(color, w,h,d, x=0,y=0,z=0){
  const geometry = new THREE.BoxGeometry( w, h, d ); 
  const material = new THREE.MeshBasicMaterial( {color} ); 
  const mesh = new THREE.Mesh( geometry, material ); 
  mesh.position.x = x;
  mesh.position.y = y;
  mesh.position.z = z;
  return { mesh, };
}
const sukiP = 1.0;
const sensorsSide = [];
const sensorsTop = [];
const sensorsBottom = [];
function init3d() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // レンダラーを作成
  const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("3d"),
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
  camera.position.set(0, 0, 3000);
  const controls = new THREE.OrbitControls(camera, document.body );
  
  const sensors3d = new THREE.Object3D();
  scene.add(sensors3d);
  
  sensors3d.add(createCube(0xffffff, 100,100,3500, 0,-500,0).mesh);
  sensors3d.add(createCube(0xffffff, 2000,100,100, 0,-500,0).mesh);
  sensors3d.add(createCube(0xffffff, 1350,100,100, 0,-500,800).mesh);
  sensors3d.add((()=>{
    const { mesh } = createCube(0xffffff, 1150,100,100, 300,-500,1250);
    mesh.rotation.y = deg2rad(55);
    return mesh;
  })());
  // Side
  for(const iy of range(51)) {
    const sensorsY = [];
    for(const ix of range(150)){
      const { mesh } = createSphere();
      const rotate = deg2rad(ix/150*360);
      mesh.position.x = Math.cos(rotate) * 500;
      mesh.position.z = Math.sin(rotate) * 500;
      mesh.position.y = 51*28 - iy * 28;
      sensors3d.add(mesh);
      sensorsY.push(mesh);
    }
    sensorsSide.push(sensorsY);
  }
  const rotateBaseTop = deg2rad(180);
  const rotateBaseBottom = deg2rad(-90);
  // Top
  for(const iy of range(48)) {
    const sensorsY = [];
    for(const ix of range(48)){
      const { mesh } = createSphere();
      const x = (ix-24)/24 *500;
      const z = (iy-24)/24 *500;
      mesh.position.x = x * Math.cos(rotateBaseTop) - z * Math.sin(rotateBaseTop);
      mesh.position.z = x * Math.sin(rotateBaseTop) + z * Math.cos(rotateBaseTop);
      mesh.position.y = 51 * 28;
      sensors3d.add(mesh);
      sensorsY.push(mesh);
    }
    sensorsTop.push(sensorsY);
  }
  // Bottom
  for(const iy of range(48)) {
    const sensorsY = [];
    for(const ix of range(48)){
      const { mesh } = createSphere();
      const x = (ix-24)/24 *500;
      const z = (iy-24)/24 *500;
      mesh.position.x = x * Math.cos(rotateBaseBottom) - z * Math.sin(rotateBaseBottom);
      mesh.position.z = x * Math.sin(rotateBaseBottom) + z * Math.cos(rotateBaseBottom);
      sensors3d.add(mesh);
      sensorsY.push(mesh);
    }
    sensorsBottom.push(sensorsY);
  }
  renderer.render(scene, camera);
  tick();
  function tick() {
    requestAnimationFrame(tick);
    //sensors3d.rotation.x += 0.01;
    //sensors3d.rotation.z += 0.01;
    controls.update()
    renderer.render(scene, camera);
  }
}
init3d();
const update = (async()=>{
  const $saigen = document.getElementById("saigen");
  const $raw = document.getElementById("raw");
  const $canvas = document.getElementById("canvas");
  const ctx = $canvas.getContext("2d");
  try{
    $raw.src = await fetch("https://kamiokande.nakasyou.repl.co").then(res=>res.blob()).then(URL.createObjectURL);
  }catch(e){
    if(window.confirm("データの取得に失敗しました。再読み込みしますか？"))
      location.reload();
    throw e;
  }
  await waitLoad($raw);
  $canvas.width = $raw.width;
  $canvas.height = $raw.height;
  ctx.drawImage($raw, 0,0)
  const imageData = ctx.getImageData(0,0,$raw.width,$raw.height);
  ctx.fillStyle = "green";
  
  const topData = getBaseData(imageData,585,25.6,ctx);
  const bottomData = getBaseData(imageData,585,656,ctx);
  const sideData = getSideData(imageData);
  
  // Side
  for(const [iy, sideY] of enumerate(sideData)) {
    if(!sensorsSide[iy])
      break;
    for(const [ix, side] of enumerate(sideY)) {
      const hex = colorToHex(side);
      const mesh = sensorsSide[iy][ix];
      if(hex === 0 || Math.random() > sukiP) {
        mesh.visible = false;
        continue;
      }
      mesh.material.color.setHex(hex)
    }
  }
  // Top
  for(const [iy, topY] of enumerate(topData)) {
    if(!sensorsTop[iy])
      break;
    for(const [ix, top] of enumerate(topY)) {
      const hex = colorToHex(top);
      const mesh = sensorsTop[iy][ix];
      if(hex === 0 || Math.random() > sukiP) {
        mesh.visible = false;
        continue;
      }
      mesh.material.color.setHex(hex)
    }
  }
  // Bottom
  for(const [iy, bottomY] of enumerate(bottomData)) {
    if(!sensorsBottom[iy])
      break;
    for(const [ix, bottom] of enumerate(bottomY)) {
      const hex = colorToHex(bottom);
      const mesh = sensorsBottom[iy][ix];
      if(hex === 0 || Math.random() > sukiP) {
        mesh.visible = false;
        continue;
      }
      mesh.material.color.setHex(hex)
    }
  }
  $lastUpdate.textContent = dateFns.format(new Date(),"MM-DD-YYYY HH:mm:ss.SSSS");
  setTimeout(update, 5000);
})
update();
/*.catch(error=>{
  console.error(`${error.name} ${error.message}`)
  console.log(error.stack)
})*/
