const electron = require('electron')
const fs = require('fs');
const path = require('path')
const url = require('url')
const child_process = require('child_process')

let { app, BrowserWindow, dialog } = electron;

const ipcMain = electron.ipcMain;


let preWindow = null;

let mkdir = path => {
	try {
		fs.mkdirSync(path);
	}catch(e) {
		return false;
	}
	return true;
}

let createModule = data => {
	try{
		let config = {
			name: data.name,
			introduction: data.description,
			enName: data.enName,
			version: '1.0.0',
			datavVersion: '1.0.0',
		  previewImg: '',
			scriptType: 'local',
			scriptAddr: path.join(data.dirname, 'build/app.js'),
			display: '',
			props: {}
		}

		let datavModuleName = 'DataVModule';
		let hashName = datavModuleName + (new Date() - 0 + '') + (100000 + Math.random()*100000);
		hashName = hashName.replace(/\./g,'');
		config.hashName = hashName;

		fs.writeFileSync(path.join(data.dirname, 'datavModuleConfig.json'), JSON.stringify(config));

		let buildDir = path.join(data.dirname, 'build/');
		let srcDir = path.join(data.dirname, 'src/');

		mkdir(buildDir);
		mkdir(srcDir);

		let indexLibData = fs.readFileSync(path.join(__dirname, 'lib/index.js.lib')).toString();
		indexLibData = indexLibData.replace(/#DatavModuleName#/g, datavModuleName);
		indexLibData = indexLibData.replace(/#DatavModuleHashName#/g, hashName);
		fs.writeFileSync(path.join(data.dirname, 'src/index.js'), indexLibData);

		let gitIgnoreData = fs.readFileSync(path.join(__dirname, 'lib/gitIgnore.lib')).toString();
		fs.writeFileSync(path.join(data.dirname, './.gitignore'), gitIgnoreData);

		let babelrcData = fs.readFileSync(path.join(__dirname, 'lib/babelrc.lib')).toString();
		fs.writeFileSync(path.join(data.dirname, './.babelrc'), babelrcData);

		let webpackData = fs.readFileSync(path.join(__dirname, 'lib/webpack.config.dev.js.lib')).toString();
		fs.writeFileSync(path.join(data.dirname, 'webpack.config.dev.js'), webpackData);

		let webpackBuildData = fs.readFileSync(path.join(__dirname, 'lib/webpack.config.build.js.lib')).toString();
		webpackBuildData = webpackBuildData.replace(/#DatavModuleHashName#/g, hashName + '_' + config.version);
		fs.writeFileSync(path.join(data.dirname, 'webpack.config.build.js'), webpackBuildData);

		let packageJSONData = fs.readFileSync(path.join(__dirname, 'lib/package.json.lib')).toString();
		packageJSONData = packageJSONData.replace(/#DatavModuleEnName#/g, data.enName);
		packageJSONData = packageJSONData.replace(/#DatavModuleDescription#/g, data.description);
		packageJSONData = packageJSONData.replace(/#DatavModuleGit#/g, data.git);
		fs.writeFileSync(path.join(data.dirname, 'package.json'), packageJSONData);

	}catch(e) {
		return false;
	}
	return true;
}

function fun_PreWindow() {
	preWindow = new BrowserWindow({width: 480, height: 320, transparent: true, frame: false, resizable: false});

	// preWindow.webContents.openDevTools();

	preWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'preWindow.html'),
		protocol: 'file:',
		slashes: true
	}));
	preWindow.on('closed', function () {
		preWindo = null
	});

	ipcMain.on("exitMain", ()=>{
		preWindow.close();
	});


	ipcMain.on('openDir', ()=>{
		dialog.showOpenDialog({
			properties: ['openDirectory']
		}, filePath=>{

			let dirname = filePath && filePath[0];
			let isHaveModule = false;
			if(dirname) {
				if(fs.existsSync(path.join(dirname, 'datavModuleConfig.json'))) {
					isHaveModule = true;
				}
			}
			preWindow.webContents.send('openDirResponse', {dirname, isHaveModule});
		});
	});


	ipcMain.on('createModule', (e, data)=>{
		let res = createModule(data);
		preWindow.webContents.send('createModuleResponse', res);
	});

}

app.on('ready', fun_PreWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {

})
