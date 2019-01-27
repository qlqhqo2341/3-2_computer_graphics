// 2014920037 computer_graphics final project 

var heli_source = {
  vertex : document.getElementById('heli_vshader').text,
  fragment : document.getElementById('heli_fshader').text,
}
var terrain_source = {
  vertex : document.getElementById('terrain_vshader').text,
  fragment : document.getElementById('terrain_fshader').text,
}
var lighter_source = {
  vertex : document.getElementById('lighter_vshader').text,
  fragment : document.getElementById('lighter_fshader').text,
}

var CHOPPER_ROTATE_STEP = 360;
var BODY_ROTATE_STEP = 10;
var MOVE_STEP = 0.05;
var body_angle = 0;

var currentPosition = new Float32Array([0,0,1.5]);
var gl;
function main() {
  var canvas = document.getElementById('webgl');
  var w = canvas.width;
  var h = canvas.height;

  // webgl 초기화, 소스 컴파일
  gl = getWebGLContext(canvas);
  gl.heli_program = createProgram(gl, heli_source.vertex, heli_source.fragment)
  gl.terrain_program = createProgram(gl, terrain_source.vertex, terrain_source.fragment)
  gl.lighter_program = createProgram(gl, lighter_source.vertex, lighter_source.fragment);
  gl.programs = ["heli", "lighter", "terrain"];
  gl.useProgram(gl.heli_program)


  // 헬리콥터 모델링
  var body_color = [0,0.9,0, 0,0.8,0, 0,0.7,0, 0,0.6,0, 0,0.5,0, 1,0.9,1, ];
  var body_vertexBuffer = createVBO(gl, [].concat(
    createCubeArray(body_color, [-0.06, -0.1, 0 , 0.06, 0.1, 0.1]), // center body
    createCubeArray([0,0.6,0], [ -0.015, -0.4, 0.05 , 0.015, -0.1, 0.06 ]), // tail.
    // connecting chopper at 큐브날개
    // createCubeArray([0, 0.75, 0], [-0.02,-0.02, 0.1, 0.02, 0.02, 0.2]),
    // connecting chopper at Triangle 날개
    createTriangleArray([0, 0.75, 0], [0.02, 0.02, 0.1, -0.02,0.02,0.1, 0,0,0.2], [0,5,1]),
    createTriangleArray([0, 0.75, 0], [0.02,-0.02, 0.1, -0.02,-0.02,0.1, 0,0,0.2], [0,-5,1]),
    createTriangleArray([0, 0.75, 0], [0.02, 0.02, 0.1, 0.02,-0.02,0.1, 0,0,0.2], [5,0,1]),
    createTriangleArray([0, 0.75, 0], [-0.02, 0.02, 0.1, -0.02,-0.02,0.1, 0,0,0.2], [-5,0,1]),

  ), 9, gl.TRIANGLES);

  //큐브 2개로 된 날개
  // var chopper_vertexBuffer = createVBO(gl, [].concat(
  //   createCubeArray([0.3,0.3,1], [-0.6,-0.04,0.2, 0.6,0.04,0.23]),
  //   createCubeArray([0.3,0.3,1], [-0.04,-0.6,0.2, 0.04,0.6,0.23])
  // ), 9, gl.TRIANGLES);

  //Triangle 4개로 된 날개
  var chopper_vertexBuffer = createVBO(gl, [].concat(
      createTriangleArray([0.3,0.3,1], [0,0,0.2, 0.6,-0.06,0.2, 0.6, 0.06,0.2]),
      createTriangleArray([0.3,0.3,1], [0,0,0.2,-0.6,-0.06,0.2,-0.6, 0.06,0.2]),
      createTriangleArray([0.3,0.3,1], [0,0,0.2, 0.06, 0.6,0.2, -0.06, 0.6,0.2]),
      createTriangleArray([0.3,0.3,1], [0,0,0.2, 0.06,-0.6,0.2, -0.06,-0.6,0.2]),
  ), 9, gl.TRIANGLES);

  // 라이트 (위치, intensity) 버퍼오브젝트
  var lighter_data = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0,]; 
  var lighter_vertexBuffer = createVBO(gl, 
    lighter_data, 4, gl.POINTS);

  // 초기화.
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // UniformLocation과 AttributeLocation gl에 담아두기.
  getVariableLocations(gl,"heli",
    ["a_Position","a_Color","a_Norm"],
    ["u_ModelMatrix","u_MVPMatrix","u_NormalMatrix", "u_Light", "u_LightPos", "u_AmbientValue"]);
  getVariableLocations(gl, "lighter",
    ["a_Position"], ["u_VPMatrix"]);
  getVariableLocations(gl, "terrain",
    ["a_TexCoord"], ["u_VPMatrix","u_Sampler","u_dxy","u_Light","u_LightPos","u_AmbientValue", "u_Length"]);

  // 라이트 초기화
  initLight(gl);

  // terrain 텍스쳐 초기화
  initTextures(gl);

  var chopper_angle = 0.0;
  get_elapsed_time();
  viewer.update_VPMatrix();
  // 실시간 애니메이션 돌리기
  var tick = function() {
    var elapsed = get_elapsed_time();
    var wholeVPMat = viewer.last_VPMatrix;
    chopper_angle = chopper_animate(chopper_angle, elapsed, CHOPPER_ROTATE_STEP);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawHeli(gl, currentPosition, body_angle, wholeVPMat, body_vertexBuffer);
    drawHeli(gl, currentPosition, chopper_angle, wholeVPMat, chopper_vertexBuffer);
    drawLighter(gl, wholeVPMat, lighter_vertexBuffer);
    if(t_loaded)
      drawterrain(gl, wholeVPMat);

    gl.lights.move(0.000001, elapsed);
    gl.lights.remove_by_boundary();
    updateLight(gl, ["heli", "terrain"]);
    requestAnimationFrame(tick, canvas);
    document.getElementById('info').innerText = 'location :'+
      currentPosition[0].toFixed(2) + ", " + currentPosition[1].toFixed(2) + ", " + currentPosition[2].toFixed(2) +
      " remain_lights: " + gl.lights.get_remains() +
      " fps: " + fps;
  };
  tick();
}

function initLight(gl){
  var fixed_light = {
    value: 2.0,
    xyz: [2,-2,3],
    used: true, 
  }
  var none_light = {
    value: 0.0,
    xyz: [0,0,0],
    toward: [1,1,1],
    used: false,
  }  
  
  gl.lights = [
    fixed_light, none_light, none_light,
    none_light, none_light, none_light, 
    none_light, none_light, none_light, 
  ];
  
  gl.lights.none_light = none_light;
  gl.lights.get_blank_i = function(){
    var blank_i;
    for(blank_i=1;blank_i<9 && gl.lights[blank_i]!=gl.lights.none_light;blank_i++);
    return blank_i;
  }
  gl.lights.add = function(light, light_xyz, toward_xy){
    var new_light = {
      value: light, xyz: light_xyz, used:true,
      toward: normalize(toward_xy), v_xy: 0.0015, v_z: -0.0001,
    };
    var blank_i = gl.lights.get_blank_i();
    if(blank_i<9)
      gl.lights[blank_i]=new_light;
  }
  // boundary is square plane centered at (0,0).
  gl.lights.remove_by_boundary = function(){
    for(var i=1;i<9;i++){
      var l = gl.lights[i];
      var z = l.xyz[2];
      if (z<0.0)
        gl.lights[i]=gl.lights.none_light;
    }
  }
  // 흐른 시간에 따라 라이트들을 움직임.
  gl.lights.move = function(g, time){
    for(var i=1;i<9;i++){
      var l = gl.lights[i];
      if(l==gl.lights.none_light)
        continue;

      var v_xy = l.v_xy, v_z = l.v_z;
      let [x,y,z] = l.xyz;
      let [tx,ty] = l.toward;
      l.xyz = [x + (tx*v_xy*time), y + (ty*v_xy*time), z - (v_z*time)];
      l.v_z += time*g;
    }
  }
  // 남은 라이트의 갯수 반환.
  gl.lights.get_remains = function(){
    var cnt=0;
    for(var i=0;i<9;i++)
      if(gl.lights[i].used==false)
        cnt++;
    return cnt;
  }
  updateLight(gl, ["heli", "terrain"]);
}

function updateLight(gl, programs){
  var lights_values=[], lights_xyz=[];
  for(var l of gl.lights){
    lights_values = lights_values.concat(l.value);
    lights_xyz = lights_xyz.concat(l.xyz, [0.0]);
  }
  for(var program_name of programs){
    var vars = gl[program_name+"_var"];
    gl.useProgram(gl[program_name+"_program"]);
    gl.uniform1fv(vars.u_Light, new Float32Array(lights_values));
    gl.uniform4fv(vars.u_LightPos, new Float32Array(lights_xyz));
    gl.uniform1f(vars.u_AmbientValue, 0.2);
  }
}
function move(direct){
  var unit = (direct == true) ? MOVE_STEP : -MOVE_STEP;
  var diff = [ unit*Math.sin(body_angle*Math.PI/180.0), unit*Math.cos(body_angle*Math.PI/180.0) ];
  currentPosition[0]+=diff[0];
  currentPosition[1]+=diff[1];
}
function keydown(event) {
  switch (event.key) {
    case "ArrowDown":
    case "UIKeyInputDownArrow":
      (event.shiftKey) ? viewer.change_theta(10) : move(false);
      break;
    case "ArrowUp":
    case "UIKeyInputUpArrow":
      (event.shiftKey) ? viewer.change_theta(-10) : move(true);
      break;
    case "ArrowLeft":
    case "UIKeyInputLeftArrow":
      (event.shiftKey) ? viewer.change_phi(-10) : body_angle = (body_angle - BODY_ROTATE_STEP ) % 360;
      break;
    case "ArrowRight":
    case "UIKeyInputRightArrow":
      (event.shiftKey) ? viewer.change_phi(10) : body_angle = (body_angle + BODY_ROTATE_STEP ) % 360;
      break;
    case "a":
      currentPosition[2]+=MOVE_STEP;
      break;
    case "z":
      currentPosition[2]-=MOVE_STEP;
      break;
    case "=":
      viewer.change_r(-1);
      break;
    case "-":
      viewer.change_r(1);
      break;
    case " ":
      var p = currentPosition;
      gl.lights.add(0.5 , [p[0], p[1], p[2]] , [ Math.sin(body_angle*Math.PI/180.0), Math.cos(body_angle*Math.PI/180.0) ]);
      break;
    default:
      console.log("Clicked : " + event.key);
      break;
  }
}
function keyup(event){
  switch (event.key){
    case "Shift":
      console.log("shift canceled");
      break;
  }
}