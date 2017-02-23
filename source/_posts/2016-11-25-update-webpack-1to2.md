---
title: Webpack 1 更新到 Webpack 2 的蹚坑记
date: 2016-11-25 17:41:41
updated: 2016-11-25 18:27:59
tags:
---
>　　真的就是手痒才更新到2的...

##更新
***
　　写此文时，webpack更新到2.1.0-beta.27。

首先运行更新命令：    
`npm install webpack@2.1.0-beta.27 --save-dev`  
如果要全局更新就使用：  
`npm install webpack@2.1.0-beta.27 --save-dev`

　　更新完之后，webpack 2 兼容老版本的配置，所以直接运行是没有问题的。据说 webpack 2 的 **tree-shaking** 还可以优化体积。  

##迁移
***
　　去webpack官网扫了一眼，虽然v2兼容v1的，但v2修改了配置文件的语法。  
[https://webpack.js.org/guides/migrating/](https://webpack.js.org/guides/migrating/)

　　列举影响最深的两条:

> ####`module.loaders` is now `module.rules`
The old loader configuration was superseded by a more powerful rules system, which allows configuration of loaders and more. For compatibility reasons, the old module.loaders syntax is still valid and the old names are parsed. The new naming conventions are easier to understand and are a good reason to upgrade the configuration to using module.rules.

> ####`module.loaders` 更改为 `module.rules`
>　　旧版本的 loader 配置已经被更强大的 rules 取代，新的 rules 能够配置 loader 之外的更多选项。出于兼容考虑，旧的 `module.loaders` 语法仍然能被解析。然而，新的命名规范更易理解，推荐将配置文件更新为使用 `module.rules` 语法。

```
  module: {
-   loaders: [
+   rules: [
      {
        test: /\.css$/,
-       loaders: [
+       use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader",
-           query: {
+           options: {
              modules: true
            }
        ]
      }
    ]
  }
```

> ####Automatic `-loader` module name extension removed
It is not possible anymore to omit the `-loader` extension when referencing loaders:
> ####在模块名后自动补上 -loader 后缀的功能被移除
　　在引用 loader 时，再也不能省略 `-loader` 后缀：
```
        loaders: [
-           "style",
+           "style-loader",
-           "css",
+           "css-loader",
-           "less",
+           "less-loader",
        ]
```
>You can still opt-in to the old behavior with the `resolveLoader.moduleExtensions` configuration option.  
>　　你可以通过添加 `resolveLoader.moduleExtensions` 配置项，继续使用以前的格式。
```
resolveLoader: {
  moduleExtensions: ["-loader"]
}
```

　　愉快的改好`webpack.config.js`，接下来开始曲折的趟坑之旅。

##蹚坑
***
　　满心欢喜的build一发。
```nohighlight
$ npm run build

> hdzx_v4_html@1.0.0 build /Users/j3l11234/Documents/nodejs/hdzx_v4_html
> gulp build

[15:28:59] Using gulpfile ~/Documents/nodejs/hdzx_v4_html/gulpfile.js
[15:28:59] Starting 'clean'...
[15:28:59] Finished 'clean' after 21 ms
[15:28:59] Starting 'build'...
[15:28:59] Starting 'style'...
[15:28:59] Finished 'style' after 21 ms
[15:28:59] Starting 'webpack'...
[15:28:59] Finished 'webpack' after 297 ms
[15:28:59] Finished 'build' after 320 ms
[15:29:01] Plumber found unhandled error:
 Error in plugin 'webpack-stream'
Message:
    ./src/js/approve/index.js
Module parse failed: /Users/j3l11234/Documents/nodejs/hdzx_v4_html/src/js/approve/index.js Unexpected token (180:6)
You may need an appropriate loader to handle this file type.
SyntaxError: Unexpected token (180:6)
    at Parser.pp$4.raise (/Users/j3l11234/Documents/nodejs/hdzx_v4_html/node_modules/.npminstall/acorn/3.3.0/acorn/dist/acorn.js:2221:15)
    at Parser.pp.unexpected (/Users/j3l11234/Documents/nodejs/hdzx_v4_html/node_modules/.npminstall/acorn/3.3.0/acorn/dist/acorn.js:603:10)
```  
　　诶？这和剧本写的不一样啊？check一下配置文件：
```
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          'presets': [
            ['es2015', {modules: false}],
            'react'
          ]
        }
      }
    ]
  },
```
　　无肉眼可见的配置错误，不过提示**You may need an appropriate loader to handle this file type.**，也就是loader没有载入出来。经过几个世纪的测试，最后试了一条命令：
```
$ ./node_modules/webpack/bin/webpack.js 
Hash: e2a6ffe6d35f21cf8167
Version: webpack 2.1.0-beta.27
Time: 3127ms
         Asset      Size  Chunks             Chunk Names
  order.js.map  85 bytes       0  [emitted]  order
      order.js   1.46 kB       0  [emitted]  order
      login.js   1.54 kB       2  [emitted]  login
       lock.js   1.82 kB       3  [emitted]  lock
      issue.js   1.51 kB       4  [emitted]  issue
    approve.js   1.09 kB       5  [emitted]  approve
     common.js    728 kB       6  [emitted]  common
    myorder.js   1.33 kB       1  [emitted]  myorder
myorder.js.map  87 bytes       1  [emitted]  myorder
  login.js.map  85 bytes       2  [emitted]  login
   lock.js.map  84 bytes       3  [emitted]  lock
  issue.js.map  85 bytes       4  [emitted]  issue
approve.js.map  87 bytes       5  [emitted]  approve
 common.js.map    893 kB       6  [emitted]  common
 [189] multi common 64 bytes {6} [built]
    + 189 hidden modules
```  
　　直接去调用 node_modules 里的 webpack 是成功的，使用 gulp 就不行，而 gulp 借助 webpack-stream 来实现 webpack 调用，莫非是 webpack-stream 的问题？翻出 webpack-stream 的 `package.json`：
```json
{
  "name": "webpack-stream",
  "version": "3.2.0",
  "description": "Run webpack as a stream",
  "license": "MIT",
  "homepage": "https://github.com/shama/webpack-stream",
  "repository": "shama/webpack-stream",
  "author": {
    "name": "Kyle Robinson Young",
    "email": "kyle@dontkry.com",
    "url": "http://dontkry.com"
  },
  "engines": {
    "node": ">= 0.10.0"
  },
  "scripts": {
    "test": "semistandard && node test/test.js"
  },
  "files": [
    "index.js"
  ],
  "semistandard": {
    "ignore": [
      "test/fixtures",
      "examples"
    ]
  },
  "dependencies": {
    "gulp-util": "^3.0.7",
    "lodash.clone": "^4.3.2",
    "lodash.some": "^4.2.2",
    "memory-fs": "^0.3.0",
    "through": "^2.3.8",
    "vinyl": "^1.1.0",
    "webpack": "^1.12.9"
  },
  "devDependencies": {
    "gulp": "^3.9.0",
    "rimraf": "^2.4.4",
    "semistandard": "^7.0.4",
    "tape": "^4.2.2",
    "vinyl-fs": "^2.2.1",
    "vinyl-named": "^1.1.0"
  },
  "keywords": [
    "gulpplugin",
    "webpack",
    "stream"
  ],
  "_from": "webpack-stream@3.2.0",
  "_resolved": "http://registry.npm.taobao.org/webpack-stream/download/webpack-stream-3.2.0.tgz"
}
```  
　　OMG，webpack-stream 依赖的是 webpack^1.12.9 ，于是在使用 gulp 的时候，最终调用的还是 webpack^1.12.9，于是配置里的 rules 不被识别， loader 声明无效， build错误也就是完全可以理解的了。  
　　老方法，看源码：
```javascript
module.exports = function (options, wp, done) {
  ...

  var webpack = wp || require('webpack');

  ...
};
```  
　　看到闪闪发光的一行，webpack-stream 是可以注入 webpack 实例的，如果不注入，就使用 `require('webpack')` 引入 webpack-stream 自身所依赖的 webpack^1.12.9 。  
　　怒改 `gulpfile.js`，在调用 webpack-stream 的时候手动传入 `require('webpack')` 。
```javascript
gulp.task('webpack-watch', function() {
  gulp.src('./src/js/**/*.js')
    .pipe(plumber())
    .pipe(webpack(Object.assign(require('./webpack.config.js'),{watch:true}),require('webpack')))
    .pipe(gulp.dest(DIST + '/js'));
});

gulp.task('webpack', function() {
  gulp.src('./src/js/**/*.js')
    .pipe(plumber())
    .pipe(webpack(require('./webpack.config.js'),require('webpack')))
    .pipe(gulp.dest(DIST + '/js'));
});
```

　　再 build 一把，一次OK：
```nohighlight
$ npm run build

> hdzx_v4_html@1.0.0 build /Users/j3l11234/Documents/nodejs/hdzx_v4_html
> gulp build

[17:05:48] Using gulpfile ~/Documents/nodejs/hdzx_v4_html/gulpfile.js
[17:05:48] Starting 'clean'...
[17:05:48] Finished 'clean' after 6.6 ms
[17:05:48] Starting 'build'...
[17:05:48] Starting 'style'...
[17:05:48] Finished 'style' after 14 ms
[17:05:48] Starting 'webpack'...
[17:05:48] Finished 'webpack' after 348 ms
[17:05:48] Finished 'build' after 364 ms
[17:06:00] Version: webpack 2.1.0-beta.27
         Asset    Size  Chunks             Chunk Names
  order.js.map  238 kB       0  [emitted]  order
      order.js  230 kB       0  [emitted]  order
    myorder.js  169 kB       2  [emitted]  myorder
    approve.js  172 kB       3  [emitted]  approve
      issue.js  145 kB       4  [emitted]  issue
      login.js  101 kB       5  [emitted]  login
     common.js  729 kB       6  [emitted]  common
       lock.js  183 kB       1  [emitted]  lock
   lock.js.map  195 kB       1  [emitted]  lock
myorder.js.map  184 kB       2  [emitted]  myorder
approve.js.map  190 kB       3  [emitted]  approve
  issue.js.map  161 kB       4  [emitted]  issue
  login.js.map  121 kB       5  [emitted]  login
 common.js.map  894 kB       6  [emitted]  common
```

　　老哥，稳。

##后记
***
　　台上一分钟，台下十年功，博客写的6，其实找问题的时候真的想疯。然后，不看 github 真是太傻了，下次遇到问题一定要到全球最大的同性交友平台问问！   
[https://github.com/shama/webpack-stream/issues/125](https://github.com/shama/webpack-stream/issues/125)


