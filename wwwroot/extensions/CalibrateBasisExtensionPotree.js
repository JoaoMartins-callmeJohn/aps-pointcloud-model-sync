const CalibrateBasisPotreeToolToolName = 'calibratebasispotree-tool';

class CalibrateBasisPotreeTool extends Autodesk.Viewing.ToolInterface {
  constructor(viewer, options) {
    super();
    this.viewer = viewer;
    this.names = [CalibrateBasisPotreeToolToolName];
    this.active = false;
    this.snapper = null;
    this.points = [];
    // Hack: delete functions defined on the *instance* of a ToolInterface (we want the tool controller to call our class methods instead)
    delete this.register;
    delete this.deregister;
    delete this.activate;
    delete this.deactivate;
    delete this.getPriority;
    delete this.handleMouseMove;
    delete this.handleSingleClick;
    delete this.handleKeyUp;
  }

  register() {
    // this.snapper = new Autodesk.Viewing.Extensions.Snapping.Snapper(this.viewer, { renderSnappedGeometry: false, renderSnappedTopology: false });
    // this.viewer.toolController.registerTool(this.snapper);
    // this.viewer.toolController.activateTool(this.snapper.getName());
    console.log('CalibrateBasisPotreeTool registered.');
  }

  deregister() {
    // this.viewer.toolController.deactivateTool(this.snapper.getName());
    // this.viewer.toolController.deregisterTool(this.snapper);
    // this.snapper = null;
    console.log('CalibrateBasisPotreeTool unregistered.');
  }

  activate(name, viewer) {
    if (!this.active) {
      console.log('CalibrateBasisPotreeTool activated.');
      this.active = true;

      this.prepareDataViz();
    }
  }

  async prepareDataViz() {
    this.dataVizExtn = this.viewer.getExtension("Autodesk.DataVisualization");
    let DataVizCore = Autodesk.DataVisualization.Core;
    this.viewableData = new DataVizCore.ViewableData();
    this.viewableData.spriteSize = 32; // Sprites as points of size 24 x 24 pixels
    let viewableType = DataVizCore.ViewableType.SPRITE;

    let pointsColor = new THREE.Color(0xffffff);

    let firstPointIconUrl = "https://img.icons8.com/ios/50/null/1-circle.png";
    let secondPointIconUrl = "https://img.icons8.com/ios/50/null/2-circle.png";
    let thirdPointIconUrl = "https://img.icons8.com/ios/50/null/3-circle.png";
    let fourthPointIconUrl = "https://img.icons8.com/ios/50/null/4-circle.png";

    this.pointStyles = [
      new DataVizCore.ViewableStyle(viewableType, pointsColor, firstPointIconUrl),
      new DataVizCore.ViewableStyle(viewableType, pointsColor, secondPointIconUrl),
      new DataVizCore.ViewableStyle(viewableType, pointsColor, thirdPointIconUrl),
      new DataVizCore.ViewableStyle(viewableType, pointsColor, fourthPointIconUrl)
    ];
  }

  deactivate(name) {
    if (this.active) {
      console.log('CalibrateBasisPotreeTool deactivated.');
      this.active = false;
    }
  }

  getPriority() {
    return 13; // Feel free to use any number higher than 0 (which is the priority of all the default viewer tools)
  }

  handleMouseMove(event) {
    if (!this.active) {
      return false;
    }

    // this.snapper.indicator.clearOverlays();
    // if (this.snapper.isSnapped()) {
    //   this.viewer.clearSelection();
    //   const result = this.snapper.getSnapResult();
    //   const { SnapType } = Autodesk.Viewing.MeasureCommon;
    //   this.snapper.indicator.render(); // Show indicator when snapped to a vertex
    // }
    return false;
  }

  handleSingleClick(event, button) {
    if (!this.active) {
      return false;
    }

    //Using positions
    let cameraPosition = this.viewer.getCamera().position;

    //Viewer camera based raycaster
    const { left: startX, top: startY, right: endX, bottom: endY } = this.viewer.impl.getCanvasBoundingClientRect();
    let x_component = (event.clientX - startX) / (endX - startX) * 2 - 1;
    let y_component = (event.clientY - startY) / (startY - endY) * 2 + 1;
    let raycaster = new THREE.Raycaster();
    let vector2D = new THREE.Vector2(x_component, y_component);

    // let helperCamera = new THREE.OrthographicCamera(this.viewer.impl.camera.left, this.viewer.impl.camera.right, this.viewer.impl.camera.top, this.viewer.impl.camera.bottom, this.viewer.impl.camera.near, this.viewer.impl.camera.far);
    let helperCamera = new THREE.PerspectiveCamera(this.viewer.impl.camera.fov, this.viewer.impl.camera.aspect, this.viewer.impl.camera.near, this.viewer.impl.camera.far);
    helperCamera.position.set(this.viewer.impl.camera.position.x, this.viewer.impl.camera.position.y, this.viewer.impl.camera.position.z);
    helperCamera.quaternion.set(this.viewer.impl.camera.quaternion._x, this.viewer.impl.camera.quaternion._y, this.viewer.impl.camera.quaternion._z, this.viewer.impl.camera.quaternion._w);
    helperCamera.up.set(this.viewer.impl.camera.up.x, this.viewer.impl.camera.up.y, this.viewer.impl.camera.up.z);

    for (let i = 0; i < 15; i++) {
      helperCamera.matrixWorld.elements[i] = this.viewer.impl.camera.matrixWorld.elements[i];
    }

    raycaster.setFromCamera(vector2D, helperCamera);
    raycaster.ray.origin.set(helperCamera.position.x, helperCamera.position.y, helperCamera.position.z);

    raycaster.params = {
      Mesh: {},
      Line: { threshold: 1 },
      LOD: {},
      PointCloud: { threshold: 0.05 },
      Sprite: {}
    };

    let potreeExt = this.viewer.getExtension('PotreeExtension');
    let ptCloudOctrees = potreeExt._group.children;

    ptCloudOctrees.forEach(octree => {
      // calculate objects intersecting the picking ray
      let intersectschildren = raycaster.intersectObjects(octree.children);

      //This gets the closest point to the ray
      let intersection = intersectschildren.reduce((prev, curr) => prev.distanceToRay < curr.distanceToRay ? prev : curr);

      //This gets the closest point to the camera
      // let intersection = intersectschildren.reduce((prev, curr) => prev.point.distanceTo(cameraPosition) < curr.point.distanceTo(cameraPosition) ? prev : curr);

      if (button === 0 && !!intersection.point) {
        this.points.push(intersection.point.clone());
        let addedPointIndex = this.points.length - 1;
        this.renderSprite(this.points[addedPointIndex], addedPointIndex + 10000, addedPointIndex);

        if (this.points.length == 4) {
          if (this.arePointsCoplanar()) {
            return true;
          }

          this.updatePoints();
          this.resetPoints();
          return true; // Stop the event from going to other tools in the stack
        }
      }
    });

    //Below is for Viewer meshes
    // if (button === 0 && this.snapper.isSnapped()) {
    //   const result = this.snapper.getSnapResult();
    //   const { SnapType } = Autodesk.Viewing.MeasureCommon;
    //   this.points.push(result.intersectPoint.clone());
    //   let addedPointIndex = this.points.length - 1;
    //   this.renderSprite(this.points[addedPointIndex], addedPointIndex + 10000, addedPointIndex)

    //   if (this.points.length == 4) {
    //     if (this.arePointsCoplanar()) {
    //       return true;
    //     }

    //     this.updatePoints();
    //     this.resetPoints();
    //     return true; // Stop the event from going to other tools in the stack
    //   }
    // }
    return false;
  }

  arePointsCoplanar() {
    let v12 = this.points[1].clone().sub(this.points[0]);
    let v13 = this.points[2].clone().sub(this.points[0]);
    let v14 = this.points[3].clone().sub(this.points[0]);
    return Math.abs(v12.cross(v13).dot(v14)) < 0.0001;
  }

  handleKeyUp(event, keyCode) {
    if (this.active) {
      if (keyCode === 27) {
        this.points = [];
        return true;
      }
    }
    return false;
  }

  updatePoints() {
    let v12 = this.points[1].clone().sub(this.points[0]);
    let v13 = this.points[2].clone().sub(this.points[0]);
    this.basis1 = this.points[1].clone().sub(this.points[0]);
    let line12 = new THREE.Line3(this.points[0], this.points[1]);
    let plane123 = (new THREE.Plane()).setFromCoplanarPoints(this.points[0], this.points[1], this.points[2]);
    let auxPoint = line12.closestPointToPoint(this.points[2], false);
    this.basis2 = this.points[2].clone().sub(auxPoint);
    let auxDistance = plane123.distanceToPoint(this.points[3]);
    let auxVector = v12.cross(v13);
    this.basis3 = auxVector.normalize().multiplyScalar(auxDistance);

    let auxbaseMatrix = new THREE.Matrix4();
    this.baseOrigin = this.points[0].clone();
    this.obliqueVector = this.basis1.clone().add(this.basis2.clone()).add(this.basis3.clone());
    this.spaceBaseNormal = auxbaseMatrix.clone().makeBasis(this.basis1.clone().normalize(), this.basis2.clone().normalize(), this.basis3.clone().normalize());
  }

  resetPoints() {
    this.points = [];
  }

  clearSprites() {
    this.resetPoints();
    this.dataVizExtn.removeAllViewables();
  }

  renderSprite(spritePosition, dbId, pointIndex) {
    let DataVizCore = Autodesk.DataVisualization.Core;
    const viewable = new DataVizCore.SpriteViewable(spritePosition, this.pointStyles[pointIndex], dbId);
    this.viewableData.addViewable(viewable);

    this.viewableData.finish().then(() => {
      this.dataVizExtn.addViewables(this.viewableData);
    });
  }

}

class CalibrateBasisPotreeExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this._button = null;
    this.tool = new CalibrateBasisPotreeTool(viewer);
    this._onObjectTreeCreated = (ev) => this.onModelLoaded(ev.model);
  }

  async onModelLoaded(model) {
    this.dataVizExtn = await this.viewer.getExtension("Autodesk.DataVisualization");
  }

  async load() {
    // await this.viewer.loadExtension('Autodesk.Snapping');
    this.viewer.toolController.registerTool(this.tool);
    this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, this._onObjectTreeCreated);
    return true;
  }

  unload() {
    if (this._button) {
      this.removeToolbarButton(this._button);
      this._button = null;
    }
    return true;
  }

  onToolbarCreated() {
    const controller = this.viewer.toolController;
    this._button = this.createToolbarButton('calibratebasispotree-button', 'https://img.icons8.com/ios/30/null/dotted-cloud.png', 'Calibrate Potree basis tool');
    this._button.onClick = () => {
      if (controller.isToolActivated(CalibrateBasisPotreeToolToolName)) {
        controller.deactivateTool(CalibrateBasisPotreeToolToolName);
        this.tool.clearSprites();
        this._button.setState(Autodesk.Viewing.UI.Button.State.INACTIVE);
      } else {
        controller.activateTool(CalibrateBasisPotreeToolToolName);
        this._button.setState(Autodesk.Viewing.UI.Button.State.ACTIVE);
      }
    };
  }

  createToolbarButton(buttonId, buttonIconUrl, buttonTooltip) {
    let group = this.viewer.toolbar.getControl('coordinates-toolbar-group');
    if (!group) {
      group = new Autodesk.Viewing.UI.ControlGroup('coordinates-toolbar-group');
      this.viewer.toolbar.addControl(group);
    }
    const button = new Autodesk.Viewing.UI.Button(buttonId);
    button.setToolTip(buttonTooltip);
    group.addControl(button);
    const icon = button.container.querySelector('.adsk-button-icon');
    if (icon) {
      icon.style.backgroundImage = `url(${buttonIconUrl})`;
      icon.style.backgroundSize = `24px`;
      icon.style.backgroundRepeat = `no-repeat`;
      icon.style.backgroundPosition = `center`;
    }
    return button;
  }

  removeToolbarButton(button) {
    const group = this.viewer.toolbar.getControl('coordinates-toolbar-group');
    group.removeControl(button);
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension('CalibrateBasisPotreeExtension', CalibrateBasisPotreeExtension);
