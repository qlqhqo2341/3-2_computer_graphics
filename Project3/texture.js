var textureBuffer, image;
var vertexTexCoordBuffer, vertexTexCoordIndexBuffer;
var t_unit=1000;
var t_index_length;
var t_loaded=false;

function initTextures(gl) {
  textureBuffer = gl.createTexture();   // Create a texture object

  image = new Image();  // Create the image object
  image.crossOrigin = "anonymous";
  // Register the event handler to be called on loading an image
  image.onload = function(){ initTextures_imageloaded(gl, image); };
  // Tell the browser to load an image
  image.src = 'terrain.jpg';
    
  var points_list = [];
  for(var i=t_unit;i>=0;i--){
    var y = i*1.0/t_unit;
    for(var j=0;j<=t_unit;j++){
      var x = j*1.0/t_unit;
      points_list.push(...[x,y]);
    }
  }

  var points_index_list = [];
  var cut_bound = parseInt(t_unit*0.01);
  var length=t_unit+1;
  for(var i=cut_bound;i<=t_unit-1-cut_bound;i++){
    for(var j=cut_bound;j<=t_unit-1-cut_bound;j++){
      //up down left right combination. at index.
      var ul = (i*length)+j, ur = (i*length)+(j+1), dl = ( (i+1)*length ) +j, dr = ( (i+1)*length ) + (j+1);
      var output = [dl,ul,ur, dl,dr,ur];
      // var output = [dl,ul,ur];
      points_index_list.push(...output);
    }
  }
  t_index_length = points_index_list.length;

  // Create the buffer object
  vertexTexCoordBuffer = gl.createBuffer();

  // elements indices values can be Integer 4bytes Range!
 var ext = gl.getExtension('OES_element_index_uint');

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points_list), gl.STATIC_DRAW);

  vertexTexCoordIndexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexTexCoordIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(points_index_list), gl.STATIC_DRAW);
  return true;
}
/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {*} image 
 */
  function initTextures_imageloaded(gl, image){
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, textureBuffer);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  t_loaded=true;
}
  
function drawterrain(gl, VPMatrix){
  gl.useProgram(gl.terrain_program);
  gl.uniformMatrix4fv(gl.terrain_var.u_VPMatrix, false, VPMatrix.elements);
  gl.uniform1i(gl.terrain_var.u_Sampler, 0);
  gl.uniform2f(gl.terrain_var.u_dxy, 1/t_unit, 1/t_unit);
  gl.uniform1f(gl.terrain_var.u_Length, 6.0);

  var FSIZE = 4;
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
  gl.vertexAttribPointer(gl.terrain_var.a_TexCoord, 2, gl.FLOAT, false, FSIZE*2, 0);
  gl.enableVertexAttribArray(gl.terrain_var.a_TexCoord);  // Enable the assignment of the buffer object

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexTexCoordIndexBuffer);

  gl.drawElements(gl.TRIANGLES, t_index_length, gl.UNSIGNED_INT, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}