---
title: GHOSTXP二次封装实战
date: 2009-07-31 00:01:00
updated: 2009-07-31 00:01:00
tags:
---
>　　最近有位朋友(名字忘了，致歉)问二次封装的问题，今天来了点兴致，来一次封装实战。
 
　　母盘使用donghai老师最新可以信任的版本GhostXP_SP3电脑公司特别版_v9.2   
　　donghai老师是我的第一位封装老师，现在他可以确信的作品不明，这个算是一个怀念吧 

<ignore_js_op>

{% asset_img sysprep_01.jpg sysprep_01 %}

#### ISO文件信息  
**文件**：F:\GhostXP_SP3电脑公司特别版  _\GhostXP_SP3电脑公司特别版_v9.2.iso    
**大小**：719564800 字节  
**修改时间**：2008年8月31日, 20:18:40  
**MD5**：C5639A1E30EF31CF68D87BE4A301CC88  
**SHA1**： 30313025774076E5999E2D929D600E3FBE3BF694  
**CRC32**：E0F3683E 
 
　　推荐在虚拟机中进行，因为我们的目标是二次封装，在还原完ghost镜像之后，进入Pe，删除原配的驱动包(把 `C:\windows\drivers`目录下的文件删除)，把`C:\windows\runonce\注册组件时运行\任务编排.cmd`里面的前四行内容删去。  
　　原因很简单，删除驱动，就可以保持系统在驱动方面的纯净(注册表的另说)。删除`任务编排.cmd`里边的批处理，更是为了纯净。
{% asset_img sysprep_02.jpg sysprep_02 %}


　　进入部署模式，在S&R&S选择扩展接口的时候，不要选那两个选项。  
{% asset_img sysprep_03.jpg sysprep_03 %}

　　部署完成得出奇的快(－－，)之后进入桌面，选择删除集成驱动。
{% asset_img sysprep_04.jpg sysprep_04 %}

　　很不幸，集成了我们不想要的软件，因为我们是要一个纯净的系统，不用说，把ACESEE、Maxthon、暴风影音、千千静听、搜狗输入法、迅雷卸载。office推荐保留，至于QQ，只要在注册表里删除卸载信息和文件关联和快捷方式。
{% asset_img sysprep_05.jpg sysprep_05 %}

　　至此这个系统可以说是比较纯正的了，把软件删除完之后记得重启一下，之后把系统GHOST一次。  
　　之后进入微软官方网址[http://windowsupdate.microsoft.com](http://windowsupdate.microsoft.com)到里边查找需要的更新。更新了一堆东西之后再次更新才得到需要的更新，一个个下载吧。
{% asset_img sysprep_06.jpg sysprep_06 %}

　　下载完成后，把系统还原成刚才备份的那个，避免留使用痕迹。打补丁的时候推荐加上`passive /norestart /nobackup`这三个命令。利用批处理很快就补完了，再使用ylmf补丁包，安装dx运行库，顺便删除补丁垃圾。  
　　至于oem和开始菜单这种东西我就不赘述了，你们都知道 －－。
{% asset_img sysprep_07.jpg sysprep_07 %}

　　还有一个任务管理器的设置，这个本人觉得比较实用。
{% asset_img sysprep_08.jpg sysprep_08 %}

　　随便把把系统减肥一下，这个对于控制体积很有用的。
{% asset_img sysprep_09.jpg sysprep_09 %}

　　驱动我使用自由天空的自由天空综合驱动包 **SkyDriverXP_V9.5** 精简版，这个感觉很方便，很实在。
{% asset_img sysprep_10.jpg sysprep_10 %}

　　再ghost备份一次，马上就要封装了，好兴奋。  
　　封装不用说，我当然用小兵老师的封装利器Newprep2009，没有什么太多的要求，记得把自由天空的驱动解压程序加上去就可以了。
{% asset_img sysprep_11.jpg sysprep_11 %}
{% asset_img sysprep_12.jpg sysprep_12 %}


　　封装完之后进入Pe删除一些垃圾。  
删除`C:\Documents and Settings\Administrator\Local Settings\Application Data\IconCache.db`。  
删除`C:\Documents and Settings\All Users\Documents\My Music\示例音乐\北京2008一起飞.wma`。  
删除`C:\Documents and Settings\Administrator\Local Settings\Application Data\Microsoft\Media Player\*.*`。  
　　用小兵的DeepinXP中的`C:\WINDOWS\Driver Cache\i386\*.*`来替换当前的文件。  
删除`C:\WINDOWS\system32\CatRoot2`。  
删除`C:\WINDOWS\system32\dllcache\*.*`。  
删除`C:\WINDOWS\system32\config\*.sav`。  
删除所有的`*.log`。
{% asset_img sysprep_13.jpg sysprep_13 %}
{% asset_img sysprep_14.jpg sysprep_14 %}

　　开始测试，十分成功
{% asset_img sysprep_15.jpg sysprep_15 %}
{% asset_img sysprep_16.jpg sysprep_16 %}
{% asset_img sysprep_17.jpg sysprep_17 %}

呵呵  
这个二次封装实战感觉挺成功的  
但是只封装了一个纯净版  
体积控制方面感觉可以(感谢小兵老师)  
我的第一次封装也是二次封装  
回想起来很怀念。