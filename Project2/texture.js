// 0 is image_texture, 1 is white_texture
var textureBuffer, blankTextureBuffer, image;
var vertexTexCoordBuffer;
var whitePixel = new Uint8Array([255, 255, 255, 255]);


function initTextures(gl) {
  textureBuffer = gl.createTexture();   // Create a texture object
  blankTextureBuffer = gl.createTexture();
  if (!textureBuffer || !blankTextureBuffer) {
    console.log('Failed to create the texture object');
    return false;
  }
  // blank texture upload
  // Enable texture unit1
  gl.activeTexture(gl.TEXTURE1);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, blankTextureBuffer);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, 
                gl.RGBA, gl.UNSIGNED_BYTE, whitePixel);

  image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  image.crossOrigin = "anonymous";
  // Register the event handler to be called on loading an image
  image.onload = function(){ initTextures_imageloaded(gl, image); };
  // Tell the browser to load an image
  image.src = 'sample.jpg';
    
  var verticesTexCoords = new Float32Array([
    // Vertex coordinates, texture coordinate, white points.
    -2,  2, -1,  0.0, 0.0,     1,1,1,
    -2, -2, -1,  0.0, 1.0,    1,1,1,
    2,  2, -1,  1.0, 0.0,    1,1,1,
    2, -2, -1,  1.0, 1.0,    1,1,1,
  ]);
  var n = 4; // The number of vertices

  // Create the buffer object
  vertexTexCoordBuffer = gl.createBuffer();
  if (!vertexTexCoordBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

  return true;
}
  function initTextures_imageloaded(gl, image){
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, textureBuffer);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
}

  function drawRight(gl,w,h){
    var cp = currentPosition;
    var downPMat = new Matrix4().setPerspective(30,1,0.01,40);
    var downVPMat = new Matrix4(downPMat);
    downVPMat.lookAt(cp[0],cp[1],cp[2], 0,0,-100, Math.sin(body_angle*Math.PI/180.0), Math.cos(body_angle*Math.PI/180.0),-1);
    gl.viewport(w/2,0,w/2,h);
    drawTexture(gl, downVPMat);
  }
  
  function drawTexture(gl, modelMatrix){
    gl.uniformMatrix4fv(u_MVPMatrix, false, modelMatrix.elements);

    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
    var FSIZE = 4;
    //Get the storage location of a_Position, assign and enable buffer
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 8, 0);
    gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

    // Get the storage location of a_TexCoord
    var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
    if (a_TexCoord < 0) {
    console.log('Failed to get the storage location of a_TexCoord');
    return -1;
    }
    // Assign the buffer object to a_TexCoord variable
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 8, FSIZE * 3);
    gl.enableVertexAttribArray(a_TexCoord);  // Enable the assignment of the buffer object
  
    var a_Color = gl.getAttribLocation(gl.program, "a_Color");
    if (a_Color < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 8, FSIZE*5);
    gl.enableVertexAttribArray(a_Color); 

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // Draw the rectangle

    gl.uniform1i(u_Sampler, 1);
  }