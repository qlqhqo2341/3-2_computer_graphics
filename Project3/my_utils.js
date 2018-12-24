function getVariableLocations(gl, program_name, attrib_list, uniform_list){
    var program = gl[program_name+"_program"];
    var variable = {};
    for(var a of attrib_list)
        variable[a] = gl.getAttribLocation(program, a);
    for(var u of uniform_list)
        variable[u] = gl.getUniformLocation(program, u);
    gl[program_name+"_var"] = variable;
}

/**
 * 현재 어레이의 float 값을 vector로 보고 normalize합니다.
 * 기존 array는 수정하지 않습니다.
 * @param {Array} array 
 */
function normalize(array){
    var sum = 0.0;
    for(var n of array)
        sum += n*n;
    var size = Math.sqrt(sum);
    var results = [];
    for(var n of array)
        results.push(n/size);
    return results;
}

var g_last;
var fps_last=0, fps_cnt=0, fps=0;
function get_elapsed_time(){
    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;

    fps_cnt++;
    if(fps_last+1000<now){
        fps_last=now;
        fps = fps_cnt;
        fps_cnt=0;
    }

    return elapsed;
}

function chopper_animate(angle, time, rotate_step) {
    var newAngle = angle + (rotate_step * time) / 1000.0;
    return parseInt(newAngle) % 360;
}

var viewer = {
    r:10,
    theta:60,
    phi:270,
    base_PMatrix: new Matrix4().setPerspective(30,2,1,40),
    update_VPMatrix: function(){
      let [cos, sin, pi] = [Math.cos, Math.sin, Math.PI];
      var to_radian = function(a){ return a*pi/180.0;}
      var x = this.r*sin(to_radian(this.theta))*cos(to_radian(this.phi));
      var y = this.r*sin(to_radian(this.theta))*sin(to_radian(this.phi));
      var z = this.r*cos(to_radian(this.theta));
      this.last_VPMatrix = (new Matrix4(this.base_PMatrix)).lookAt(x,y,z,0,0,0,0,0,1);
    },
    change_r:function(unit){
      if(this.r+unit>0)
        this.r+=unit;
      this.update_VPMatrix();
    },
    change_phi:function(unit){
      this.phi = (this.phi + unit) % 360;
      this.update_VPMatrix();    
    },
    change_theta:function(unit){
      this.theta = (this.theta + unit) % 180;
      this.update_VPMatrix();
    }
  }