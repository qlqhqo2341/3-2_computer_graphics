// RotatingTriangle.js (c) 2012 matsuda
//

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'uniform mat4 u_MVPMatrix;\n' +
  'varying vec4 v_color;\n' + 
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_Position = u_MVPMatrix * a_Position;\n' +
  '  v_color = a_Color;\n' + 
  '  v_TexCoord = a_TexCoord;\n' + 
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' + // Precision qualifier (See Chapter 6)
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n'+
  'varying vec4 v_color;\n' + 
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_FragColor = texture2D(u_Sampler, v_TexCoord) * v_color;\n' +
  '}\n';

var CHOPPER_ROTATE_STEP = 360;
var BODY_ROTATE_STEP = 10;
var MOVE_STEP = 0.05;
var body_angle = 0;

var currentPosition = new Float32Array([0,0,0]);

var u_MVPMatrix;
var u_Sampler;

function main() {
  var canvas = document.getElementById('webgl');
  var w = canvas.width;
  var h = canvas.height;

  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  var body_color = [0,0.9,0, 0,0.8,0, 0,0.7,0, 0,0.6,0, 0,0.5,0, 1,0.9,1, ];
  var body_vertexBuffer = createVBO(gl, [].concat(
    createCubeArray(body_color, [-0.06, -0.1, 0 , 0.06, 0.1, 0.1]),
    createCubeArray([0,0.6,0], [ -0.015, -0.4, 0.05 , 0.015, -0.1, 0.06 ]),
    createCubeArray([0, 0.75, 0], [-0.02,-0.02, 0.1, 0.02, 0.02, 0.2])
  ));
  var chopper_vertexBuffer = createVBO(gl, [].concat(
    createCubeArray([0.3,0.3,1], [-0.6,-0.04,0.2, 0.6,0.04,0.23]),
    createCubeArray([0.3,0.3,1], [-0.04,-0.6,0.2, 0.04,0.6,0.23])
  ));

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  u_MVPMatrix = gl.getUniformLocation(gl.program, 'u_MVPMatrix');
  u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');

  if (!u_MVPMatrix || !u_Sampler) { 
    console.log('Failed to get the storage location of uniform_variable');
    return;
  }

  initTextures(gl);


  var chopper_angle = 0.0;
  var wholePMat = new Matrix4().setPerspective(30,1,1,40);
  var wholeVPMat = (new Matrix4(wholePMat)).lookAt(0,-7,5,0,0,0,0,0,1);
  
  var tick = function() {
    var cp = currentPosition;
    var modelMat = (new Matrix4()).setTranslate(cp[0],cp[1],cp[2]);
    chopper_angle = chopper_animate(chopper_angle);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.viewport(0,0,w/2,h);
    draw(gl, (new Matrix4(wholeVPMat)).multiply(modelMat).rotate(body_angle,0,0,-1), body_vertexBuffer);
    draw(gl, (new Matrix4(wholeVPMat)).multiply(modelMat).rotate(chopper_angle,0,0,-1), chopper_vertexBuffer);
    drawTexture(gl, wholeVPMat);

    drawRight(gl,w,h);
    requestAnimationFrame(tick, canvas);
  };
  tick();
}

function move(direct){
  var unit = (direct == true) ? MOVE_STEP : -MOVE_STEP;
  var diff = [ unit*Math.sin(body_angle*Math.PI/180.0), unit*Math.cos(body_angle*Math.PI/180.0) ];
  currentPosition[0]+=diff[0];
  currentPosition[1]+=diff[1];

  var p=currentPosition;
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
    case "w":
      currentPosition[2]+=MOVE_STEP;
      break;
    case "s":
      currentPosition[2]-=MOVE_STEP;
      break;
    default:
      console.log("Clicked : " + event.key);
      break;
  }
}