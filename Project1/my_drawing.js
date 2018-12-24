// RotatingTriangle.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform vec4 u_Color;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'varying vec4 v_color;\n' + 
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  v_color = u_Color;\n' + 
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' + // Precision qualifier (See Chapter 6)
  '#endif\n' +
  'varying vec4 v_color;\n' + 
  'void main() {\n' +
  '  gl_FragColor = v_color;\n' +
  '}\n';

var CHOPPER_ROTATE_STEP = 360*2;
var BODY_ROTATE_STEP = 10;
var MOVE_STEP = 0.05;
var body_angle = 0;

var currentPosition = new Float32Array([0,0]);
function main() {
  var canvas = document.getElementById('webgl');

  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // var chopper_vertexBuffer = createVBO(gl,new Float32Array([
  //   0.03, -0.3,     0.03, 0.3,   -0.03, -0.3,     -0.03, 0.3
  // ]));
  var chopper_vertexBuffer = createVBO(gl, new Float32Array([
    0.0 , 0.0  , 0.04, 0.4,  -0.04,  0.4, 
    0.0 , 0.0  , 0.04,-0.4,  -0.04, -0.4,
  ]));

  var body_vertextBuffer = createVBO(gl, new Float32Array([
    0, 0.2,       -0.1, -0.2,     0.1, -0.2
  ]));
  var chopper_color = new Float32Array([0,0,0.25,0.25]);
  var body_color = new Float32Array([0,0.5,0,0.75]);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_Color = gl.getUniformLocation(gl.program, 'u_Color');

  if (!u_ModelMatrix || !u_Color) { 
    console.log('Failed to get the storage location of u_ModelMatrix or u_color');
    return;
  }
  var chopper_angle = 0.0;

  var tick = function() {
    var position = (new Matrix4()).setTranslate(currentPosition[0],currentPosition[1],0);
    chopper_angle = chopper_animate(chopper_angle);
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    draw(gl, 3, (new Matrix4(position)).rotate(body_angle,0,0,-1), u_ModelMatrix, body_color, u_Color, body_vertextBuffer);
    draw(gl, 6, (new Matrix4(position)).rotate(chopper_angle,0,0,-1), u_ModelMatrix, chopper_color, u_Color, chopper_vertexBuffer);
    requestAnimationFrame(tick, canvas);
  };
  tick();
}

function createVBO(gl, vertices){
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  return vertexBuffer;
}

function loadVBO(gl, bufferObject){
 gl.bindBuffer(gl.ARRAY_BUFFER, bufferObject);
 
 var a_Position = gl.getAttribLocation(gl.program, "a_Position");
 if(a_Position > 0) { console.log("Failed to get a_Postion"); return -1;}
 
 gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0,0);
 gl.enableVertexAttribArray(a_Position);
}

function draw(gl, n, modelMatrix, u_ModelMatrix, color, u_Color, bufferObject) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4f(u_Color, color[0],color[1],color[2],color[3]);
  loadVBO(gl, bufferObject);
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

var g_last = Date.now();
function chopper_animate(angle) {
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  var newAngle = angle + (CHOPPER_ROTATE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}
function move(direct){
  var unit = (direct == true) ? MOVE_STEP : -MOVE_STEP;
  var diff = [ unit*Math.sin(body_angle*Math.PI/180.0), unit*Math.cos(body_angle*Math.PI/180.0) ];
  currentPosition[0]+=diff[0];
  currentPosition[1]+=diff[1];

  var p=currentPosition;
  for(var i=0;i<2;i++){
      p[i] = (p[i] > 1.0) ? 1.0 : (p[i] < -1.0) ? -1.0 : p[i];
  }
}
function keydown(event) {
  switch (event.key) {
    case "ArrowDown":
      move(false);
      break;
    case "ArrowUp":
      move(true);
      break;
    case "ArrowLeft":
      body_angle = (body_angle - BODY_ROTATE_STEP ) % 360;
      break;
    case "ArrowRight":
      body_angle = (body_angle + BODY_ROTATE_STEP ) % 360;
      break;
  }
}