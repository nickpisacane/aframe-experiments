/**
 * thumb-mover
 * 
 * Move the camera in 2D (XZ-Plane) or 3D with the Joystick on various devices.
 * 
 * @TODO: Better name?
 * @TODO: Acceleration?
 */
AFRAME.registerComponent('thumb-mover', {
  schema: {
    // The entity to be moved
    target: {type: 'string'},
    // Move in 2D or 3D => ENUM(2D, 3D) 
    space: {type: 'string', default: '2D'},
  },
  init() {
    const {el, data, sceneEl} = this;

    this._dirty = false;
    this._axis = [0, 0];
    this._target = document.querySelector(`${data.target}`);
    this._2D = data.space === '2D';
    this._onAxisMove = data => {
      this._dirty = true;
      this._axis[0] = data.detail.axis[0];
      this._axis[1] = data.detail.axis[1];
    };

    el.addEventListener('axismove', this._onAxisMove);
  },

  update(oldData) {
    const {data} = this;

    if (data.target !== oldData.target) {
      this._target = document.querySelector(`${data.target}`);
    }
    this._2D = data.space === '2D';
  },

  remove() {
    const {el} = this;

    el.removeEventListener('axismove', this._onAxisMove);
  },

  tick() {
    if (!this._dirty) return;
    // TODO: Clean up and optimize.
    // NOTE: Is it worth doing vector math directly, rather than creating a bunch of THREE.js 
    //       Vector instances on each frame?

    const cam = this.el.sceneEl.camera;
    // 3-Space direction of camera
    const camDir = cam.getWorldDirection();

    // Vectors on the XZ-Plane
    const rot = new THREE.Vector2(camDir.x, camDir.z);
    const axis = new THREE.Vector2(this._axis[0], this._axis[1]);

    // Get an angle relative to the where the camera is looking, on the XZ plane. AFRAME uses
    // a right-handed cord system, thus -Z is "forward", hence the 3 PI / 2. The axis cords 
    // given match this in my tests => Full forward = -Z, full back = Z, etc. Thus, subtracting
    // -Z rotation from the axis angle produces an offset rotation of "forward".
    const angle = (axis.angle() - 3 * Math.PI / 2) + rot.angle();
    
    const delta = new THREE.Vector3(
      Math.cos(angle) * axis.length(),
      // Simply 0 if only 2D. Otherwise, the negative sin of the axis's ABSOLUTE angle, represents
      // the value [1, -1] for 1 being fully in the direction being viewed, and -1 being th opposite.
      this._2D ? 0 : camDir.y * -Math.sin(axis.angle()) * axis.length(),
      Math.sin(angle) * axis.length(),
    );

    this._target.object3D.position.add(delta);

    this._dirty = false;

  }
});