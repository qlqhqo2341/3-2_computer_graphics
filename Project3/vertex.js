
function createVBO(gl, vertices, num_units, draw_method){
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    return [vertexBuffer, vertices.length/num_units, draw_method];
}

function bufferVBO(gl, vertices, vertexBuffer){
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}

/**
 * @param {Array} colors 3*4points or 3*1point color value
 * @param {Array} vertices 3*4points ordered by arounding
 * @param {Integer} direction 1:up(+z), 2:down(-z), 3:left(-x), 4:right(+x), 5:front(-y), 6:back(+y)
 * @returns {Array} return v,color list by gl.trainges
 */
function convertQuadToTrianglesArray(colors, vertices, direction){
    // 3개의 xyz값으로된 4개의 포인트에서 해당 포인트의 xyz 쿼리
    var v_cut = function(i){i*=3; return vertices.slice(i,i+3);}
    var result = [];
    for(var i of [0,1,2, 0,3,2]){
        for(var obj of v_cut(i))
           result.push(obj);
        for(var obj of colors)
           result.push(obj);
        switch (direction) {
            case 1:
                result.push(...[0.0,0.0,1.0]);
                break;
            case 2:
                result.push(...[0.0,0.0,-1.0]);
                break;
            case 3:
                result.push(...[-1.0,0.0,0.0]);
                break;
            case 4:
                result.push(...[1.0,0.0,0.0]);
                break;
            case 5:
                result.push(...[0.0,-1.0,0.0]);
                break;
            case 6:
                result.push(...[0.0,1.0,0.0]);
                break;
            default:
                result.push(...[0.0,0.0,0.0]);
                break;
        }
    }
    return result;
}
/**
 * @param {Array} colors (up, down, left, right, front, back), each 3 float value. or only one color value.
 * @param {Array} vertices x1,y1,z1,x2,y2,z2
 */
function createCubeArray(colors, vertices){
    let [x1,y1,z1, x2,y2,z2] = vertices
    vertex_arrays = [
        [x1,y1,z2, x1,y2,z2, x2,y2,z2, x2,y1,z2], //up
        [x1,y1,z1, x1,y2,z1, x2,y2,z1, x2,y1,z1], //down
        [x1,y1,z1, x1,y1,z2, x1,y2,z2, x1,y2,z1], //left
        [x2,y1,z1, x2,y1,z2, x2,y2,z2, x2,y2,z1], //right
        [x1,y1,z1, x1,y1,z2, x2,y1,z2, x2,y1,z1], //front
        [x1,y2,z1, x1,y2,z2, x2,y2,z2, x2,y2,z1], //back
    ]
    cut = function(i){ i*=3; return colors.slice(i,i+3)}
    cut_indice = (colors.length==3) ? [0,0,0,0,0,0] : [0,1,2,3,4,5];
    var results = [];
    for(var i=0;i<6;i++)
        results.push(...convertQuadToTrianglesArray( cut(cut_indice[i]), vertex_arrays[i], i+1 ) );
    return results;  
}

/**
 * make Triangle array.
 * @param {Array} color only rgb. 3 floats values.
 * @param {Array} vertices points 3 . 1d array, 9 float data.
 * @param {Array} norm (option) norm value. default is 0,0,1.
 */
function createTriangleArray(color, vertices, norm=[0,0,1]){
    let [x1,y1,z1, x2,y2,z2, x3,y3,z3] = vertices;
    let [r,g,b] = color;
    let [nx,ny,nz] = norm;
    var results = [];
    results.push(...[x1,y1,z1, r,g,b, nx,ny,nz]);   
    results.push(...[x2,y2,z2, r,g,b, nx,ny,nz]);   
    results.push(...[x3,y3,z3, r,g,b, nx,ny,nz]);
    return results;
}

function loadHeliVBO(gl, bufferObject){
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferObject);

    var FSIZE = 4
    var a_Position = gl.heli_var.a_Position;
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE*9,0);
    gl.enableVertexAttribArray(a_Position);

    var a_Color = gl.heli_var.a_Color;
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*9, FSIZE*3);
    gl.enableVertexAttribArray(a_Color);

    var a_Norm = gl.heli_var.a_Norm;
    gl.vertexAttribPointer(a_Norm, 3, gl.FLOAT, false, FSIZE*9, FSIZE*6);
    gl.enableVertexAttribArray(a_Norm);
}

function loadLighterVBO(gl, bufferObject){
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferObject);
    
    var FSIZE=4;
    gl.vertexAttribPointer(gl.lighter_var.a_Position, 3, gl.FLOAT, false, FSIZE*3, 0);
    gl.enableVertexAttribArray(gl.lighter_var.a_Position);
}

function drawHeli(gl, position, rotate_angle, VPMatrix, bufferObject) {
    var ModelMatrix = (new Matrix4()).setTranslate(position[0], position[1],position[2]).rotate(rotate_angle, 0,0,-1);
    var MVPMatrix = (new Matrix4(VPMatrix)).multiply(ModelMatrix);
    var NormalMatrix = (new Matrix4()).setInverseOf(ModelMatrix).transpose();

    gl.useProgram(gl.heli_program);
    gl.uniformMatrix4fv(gl.heli_var.u_ModelMatrix, false, ModelMatrix.elements);
    gl.uniformMatrix4fv(gl.heli_var.u_MVPMatrix, false, MVPMatrix.elements);
    gl.uniformMatrix4fv(gl.heli_var.u_NormalMatrix, false, NormalMatrix.elements);
    loadHeliVBO(gl, bufferObject[0]);
    gl.drawArrays(bufferObject[2], 0, bufferObject[1]);
}

function drawLighter(gl, VPMatrix, bufferObject){
    var lighter_data = [];
    var cnt=0;
    for(var i=0;i<9;i++){
        l = gl.lights[i];
        if(l.used){
            cnt++;
            lighter_data.push(l.xyz[0]);
            lighter_data.push(l.xyz[1]);
            lighter_data.push(l.xyz[2]);
        }
    }
    gl.useProgram(gl.lighter_program);
    bufferVBO(gl, lighter_data, bufferObject[0]);
    loadLighterVBO(gl, bufferObject[0]);
    gl.uniformMatrix4fv(gl.lighter_var.u_VPMatrix, false, VPMatrix.elements);
    gl.drawArrays(bufferObject[2], 0, cnt);
    gl.bindBuffer(gl.ARRAY_BUFFER,null);
}