import fs from 'fs';
import child_process from 'child_process';
import rimraf from 'rimraf';
import webpack from 'webpack';
import fsUtils from './lib/fs-utils';
import webpackConfig from './webpack-config.prod';
import bc from './build-config';

const runWebpackBuild = () => {
    return new Promise((resolve, reject) => {
        webpack(webpackConfig, (err, stats) => {
            if (err) {
                reject(err);
                return;
            }
            console.info(stats.toString({
                errorDetails: true,
                colors: true,
            }));
            resolve();
        });
    });
};

const cleanDistDir = () => {
    return new Promise((resolve, reject) => {
        const files = './dist/**/*';
        rimraf(files, {}, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
};

const copyWebRoot = () => {

    return new Promise((resolve) => {
        fsUtils.mkdirp('./dist/webroot/');

        fsUtils.copyFile(
            './src/webroot/index.prod.html',
            './dist/webroot/index.html');

        const devtools = bc.devtoolsFrontend;
        if (fs.existsSync(devtools)) {
            fsUtils.copyFolder(devtools, './dist/webroot/devtools');
        }

        fsUtils.mkdirp('./dist/webroot/react-mdl/extra/css/');
        fsUtils.copyFile(
            './node_modules/react-mdl/extra/material.css',
            './dist/webroot/react-mdl/extra/material.css');
        fsUtils.copyFile(
            './node_modules/react-mdl/extra/css/material.blue-amber.min.css',
            './dist/webroot/react-mdl/extra/css/material.blue-amber.min.css');
        fsUtils.copyFile(
            './node_modules/react-mdl/extra/material.js',
            './dist/webroot/react-mdl/extra/material.js');

        fsUtils.copyFile(
            './index.prod.js',
            './dist/index.js');
        fsUtils.copyFile(
            './package.json',
            './dist/package.json');
        resolve();
    });
};

const runBabelBuild = () => {
    const inputDir = './builder/lib';
    const outputDir = './dist/lib';
    const cmd = `babel ${inputDir} --out-dir ${outputDir}`;
    return new Promise((resolve, reject) => {
        child_process.exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(error);
                reject();
                return;
            }
            if (error) {
                console.error(stderr);
                reject();
                return;
            }
            console.info(stdout);
            resolve();
        });
    });
};

(async () => {
    try {
        await cleanDistDir();
        await copyWebRoot();
        await runWebpackBuild();
        await runBabelBuild();
    } catch (e) {
        console.error('构建失败');
        console.error(e);
        return;
    }
    console.info('构建完毕');
})();
