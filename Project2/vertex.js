/**
 * 
 * @param {WebGLRenderingContext} gl webglContext
 * @param {Array} colors color arrays. must can be divided by 3
 * @param {Array} vertices vertex arrays. must be equal length to colors array
 * @param {*} traingle_method select gl.TRIANGLES, TRIANGLE_FAN, TRIANGLE_STRIP
 */
function createVBO(gl, vertices){
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    return [vertexBuffer, vertices.length/6, gl.TRIANGLES];
}

/**
 * 
 * @param {Array} colors 3*4points or 3*1point color value
 * @param {Array} vertices 3*4points ordered by arounding
 * @returns {Array} return v,color list by gl.trainges
 */
function convertQuadToTrianglesArray(colors, vertices){
    var v_cut = function(i){i*=3; return vertices.slice(i,i+3);}
    var c_cut = function(i){i*=3; return colors.slice(i,i+3);}
    c_indice = (colors.length==3) ? [0,0,0,0] : [1,2,3,4];
    var result = [];
    for(var i of [0,1,2, 0,3,2]){
        for(var obj of v_cut(i))
        result.push(obj);
        for(var obj of c_cut(c_indice[i]))
        result.push(obj);
    }
    return result;
}
/**
 * 
 * @param {Array} colors (up, down, left, right, front, back), each 3 float value. or only one color value.
 * @param {Array} vertices x1,y1,z1,x2,y2,z2
 */
function createCubeArray(colors, vertices){
    let [x1,y1,z1, x2,y2,z2] = vertices
    vertex_arrays = [
        [x1,y1,z1, x1,y1,z2, x1,y2,z2, x1,y2,z1], //left
        [x2,y1,z1, x2,y1,z2, x2,y2,z2, x2,y2,z1], //right
        [x1,y1,z1, x1,y1,z2, x2,y1,z2, x2,y1,z1], //front
        [x1,y2,z1, x1,y2,z2, x2,y2,z2, x2,y2,z1], //back
        [x1,y1,z1, x1,y2,z1, x2,y2,z1, x2,y1,z1], //down
        [x1,y1,z2, x1,y2,z2, x2,y2,z2, x2,y1,z2]  //up
    ]
    cut = function(i){ i*=3; return colors.slice(i,i+3)}
    cut_indice = (colors.length==3) ? [0,0,0,0,0,0] : [2,3,4,5,1,0];
    var results = [];
    for(var i=0;i<6;i++)
        results = results.concat(convertQuadToTrianglesArray(cut(cut_indice[i]), vertex_arrays[i]));
    return results;  
}

function loadVBO(gl, bufferObject){
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferObject);

    var a_Position = gl.getAttribLocation(gl.program, "a_Position");
    var FSIZE = 4
    if(a_Position < 0) { console.log("Failed to get attributes"); return -1;}
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE*6,0);
    gl.enableVertexAttribArray(a_Position);

    var a_Color = gl.getAttribLocation(gl.program, "a_Color");
    if(a_Color < 0) { console.log("Failed to get attributes"); return -1;}
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*6, FSIZE*3);
    gl.enableVertexAttribArray(a_Color);

    // non sense value.
    var a_TexCoord = gl.getAttribLocation(gl.program, "a_TexCoord");
    if(a_TexCoord < 0) { console.log("Failed to get attributes"); return -1;}
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_TexCoord);
}

function draw(gl, modelMatrix, bufferObject) {
    gl.uniformMatrix4fv(u_MVPMatrix, false, modelMatrix.elements);
    gl.uniform1i(u_Sampler, 1);
    loadVBO(gl, bufferObject[0]);
    gl.drawArrays(bufferObject[2], 0, bufferObject[1]);
}
  
var g_last = Date.now();
function chopper_animate(angle) {
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  var newAngle = angle + (CHOPPER_ROTATE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}