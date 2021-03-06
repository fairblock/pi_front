/**
 * 
 */
import { butil, commonjs } from '../../lang/mod';
import { Json } from '../../lang/type';
import { Dimension, FlyControl } from '../../render3d/fly_control';
import { addSceneRes, configMap, findConfigFile } from '../../render3d/load';
import { Renderer } from '../../render3d/renderer';
import { Scene, SceneData } from '../../render3d/scene';
import { ResTab } from '../../util/res_mgr';
import { toJson } from '../../util/util';
import { Forelet } from '../../widget/forelet';
import { getRealNode, paintCmd3 } from '../../widget/painter';
import { loadDir } from '../../widget/util';
import { Widget } from '../../widget/widget';

let camera3DNode;
const resTab = new ResTab();
export let scene: Scene;
let renderer: Renderer;
const width = 640;
const height = 900;
let lastMS = new Date().getTime();
let flyControl;
let widget;
let isLoad;
const forelet = new Forelet();
const rootPath = 'examples/render/res/';
const path = 'scene/';
let name = localStorage.getItem('render_name') || 'base.scene';
let cameraFactor = +localStorage.getItem('render_cf') || 1;
let nameArr;
const defualCamera3D = {
	camera: {
		perspective: [30, width / height, 0.001, 10000]
	},
	transform: {
		position: [0, 0, 20],
		rotate: [0, 3.14159265, 0],
		scale: [1, 1, -1]
	}
};

const defualCamera2D = {
	camera: {
		ortho: [-width / 2, width / 2, height / 2, -height / 2, -10000, 10000]
	},
	transform: {
		position: [0, 0, 1],
		rotate: [0, 3.14159265, 0],
		scale: [1, 1, -1]
	}
};
export let sceneData: SceneData = {
	resTab: resTab,

	lights: [
		{
			type: 'Ambient',
			color: [1, 1, 1]
		}
	]
};

/**
 * @description 导出组件Widget类
 * @example
 */
export class RenderDemo extends Widget {

	/**
	 * @description 创建后调用，一般在渲染循环外调用
	 * @example
	 */
	public create(): void {
		super.create();
		this.props = { path: path, name: name, cameraFactor: cameraFactor };
		renderer = new Renderer(width, height);
		if (nameArr) {
			this.props.selects = nameArr;
			nameArr = undefined;
		}
	}

	public firstPaint(): void {
		widget = this;
		const canvas = renderer.getCanvas();
		paintCmd3(getRealNode(widget.tree.children[0]), 'appendChild', [canvas]);
		initScene();
	}

	public updateData(data: string[]): void {
		this.props.selects = data;
		(<any>this.tree).children[0].setProps({ name: name, selects: data }, null);
		(<any>this.tree).children[0].paint();
	}

	public destroy(): boolean {
		const bool = super.destroy();
		if (!bool) {
			return false;
		}
		scene.destroy();
		scene = undefined;

		return true;
	}

	public rnChange(e: any) {
		this.props.name = name = e.value;
		localStorage.setItem('render_name', name);
		initScene();
	}
	public cfChange(e: any) {
		if (e.currentTarget.value) {
			cameraFactor = +e.currentTarget.value;
			localStorage.setItem('render_cf', e.currentTarget.value);
			if (flyControl) {
				flyControl.setRollSpeed(cameraFactor * 0.1);
				flyControl.setMovementSpeed(cameraFactor * 10);
			}
		}
	}
	public onMouseDown(event: any) {
		flyControl.onMouseLDown(event);
		flyControl.onMouseMDown(event);

		return 0;
	}
	public onMouseMove(event: any) {
		flyControl.onMouseLMove(event);
		flyControl.onMouseMMove(event);

		return 0;
	}
	public onMouseWheel(event: any) {
		flyControl.onMouseWheel(event);
	}
	public onRayCast(event: any) {
		onRayCast(event);
	}
}

const copyNode = (node) => {
	const result = JSON.parse(JSON.stringify(node));

	return result;
};

const onRayCast = (event: any) => {
	const result = scene.raycast(event.x, event.y - 40);
	console.log(result);

};

const render = () => {
	if (!scene) return;
	// sceneData.staticObj.ref.impl.position.x = sceneData.staticObj.ref.impl.position.x + 0.01;
	requestAnimationFrame(render);
	const now = new Date().getTime();
	scene.render((now - lastMS) / 1000);
	lastMS = now;
};

const init = () => {
	try {
		sceneData.staticObj = toJson(butil.utf8Decode(configMap.get(rootPath + path + name)));
		scene = renderer.createScene(sceneData);

		// tslint:disable-next-line:number-literal-format
		renderer.setClearColor(0x303030, 1.0);

		const camera = scene.getCameraObject();
		if (camera) {
			camera3DNode = camera;
		} else {
			camera3DNode = defualCamera3D;
			scene.insert(camera3DNode);
			scene.insert(defualCamera2D);
		}
		// tslint:disable-next-line:number-literal-format
		flyControl = new FlyControl(camera3DNode.ref.impl, cameraFactor * 10.0, cameraFactor * 0.1, { size: [width, height], offset: [0, 0] });
		render();
	} catch (error) {
		localStorage.setItem('render_name', 'base.scene');
	}
};

/**
 * 两个条件都准备好了，才能进行初始化
 */
const initScene = () => {
	if (scene) {
		scene.remove(camera3DNode);
		scene.remove(defualCamera2D);
		scene.destroy();
		scene = null;
	}
	if (isLoad && widget) {
		init();
	}
};
loadDir([rootPath], commonjs.flags, {}, undefined, fileMap => {
	isLoad = true;
	addSceneRes(fileMap, rootPath);
	initScene();

	const arr = [];
	for (const k in fileMap) {
		if (k.indexOf(rootPath + path) === 0) {
			arr.push(k.slice((rootPath + path).length, k.length));
		}
	}
	if (widget) {
		widget.updateData(arr);
	} else {
		nameArr = arr;
	}
// tslint:disable-next-line:no-empty
}, () => { }, () => { });
