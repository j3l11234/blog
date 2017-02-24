---
title: 在 yum remove 时保留特定依赖
date: 2016-11-23 00:20:36
updated: 2016-11-23 01:12:08
tags:
---
## 问题

　　其实这个问题出现得很偶然，就是学校云平台上预装的linux是CentOS7 Desktop，装了一大堆用不到的奇怪玩意……  
　　为了节约内存和硬盘，还有作为一个前端兼运维的强迫症，用不到的东西肯定就得删掉了，毕竟眼不见为净嘛。

<!-- more -->

> **<u>看代码请直接拉到页底</u>**

首先祭出`yum remove`大法:
```nohighlight
# yum remove perl-*

[...]

Dependencies Resolved

================================================================================
 Package                       Arch   Version              Repository      Size
================================================================================
Removing:
 perl                          x86_64 4:5.16.3-283.el7     @anaconda       22 M
 perl-Carp                     noarch 1.26-244.el7         @anaconda       28 k
 perl-Compress-Raw-Bzip2       x86_64 2.061-3.el7          @anaconda       57 k
 perl-Compress-Raw-Zlib        x86_64 1:2.061-4.el7        @anaconda      137 k
 perl-DBI                      x86_64 1.627-4.el7          @anaconda      1.9 M
 perl-Data-Dumper              x86_64 2.145-3.el7          @anaconda       97 k
 perl-Encode                   x86_64 2.51-7.el7           @anaconda      9.7 M
 perl-Error                    noarch 1:0.17020-2.el7      @anaconda       49 k
 perl-Exporter                 noarch 5.68-3.el7           @anaconda       55 k
 perl-File-Path                noarch 2.09-2.el7           @anaconda       49 k
 perl-File-Temp                noarch 0.23.01-3.el7        @anaconda      155 k
 perl-Filter                   x86_64 1.49-3.el7           @anaconda      145 k
 perl-Getopt-Long              noarch 2.40-2.el7           @anaconda      132 k
 perl-Git                      noarch 2.10.0-1.gf.el7      @/perl-Git-2.10.0-1.gf.el7.noarch
                                                                           61 k
 perl-HTTP-Tiny                noarch 0.033-3.el7          @anaconda       95 k
 perl-IO-Compress              noarch 2.061-2.el7          @anaconda      795 k
 perl-Net-Daemon               noarch 0.48-5.el7           @anaconda      116 k
 perl-PathTools                x86_64 3.40-5.el7           @anaconda      170 k
 perl-PlRPC                    noarch 0.2020-14.el7        @anaconda       69 k
 perl-Pod-Escapes              noarch 1:1.04-283.el7       @anaconda       21 k
 perl-Pod-Perldoc              noarch 3.20-4.el7           @anaconda      163 k
 perl-Pod-Simple               noarch 1:3.28-4.el7         @anaconda      526 k
 perl-Pod-Usage                noarch 1.63-3.el7           @anaconda       44 k
 perl-Scalar-List-Utils        x86_64 1.27-248.el7         @anaconda       66 k
 perl-Socket                   x86_64 2.010-3.el7          @anaconda      112 k
 perl-Storable                 x86_64 2.45-3.el7           @anaconda      177 k
 perl-TermReadKey              x86_64 2.30-20.el7          @anaconda       59 k
 perl-Text-ParseWords          noarch 3.29-4.el7           @anaconda       16 k
 perl-Time-Local               noarch 1.2300-2.el7         @anaconda       43 k
 perl-constant                 noarch 1.27-2.el7           @anaconda       26 k
 perl-libs                     x86_64 4:5.16.3-283.el7     @anaconda      1.6 M
 perl-macros                   x86_64 4:5.16.3-283.el7     @anaconda      5.0 k
 perl-parent                   noarch 1:0.225-244.el7      @anaconda      8.0 k
 perl-podlators                noarch 2.5.1-3.el7          @anaconda      281 k
 perl-threads                  x86_64 1.87-4.el7           @anaconda       96 k
 perl-threads-shared           x86_64 1.43-6.el7           @anaconda       72 k
Removing for dependencies:
 MariaDB-client                x86_64 10.1.18-1.el7.centos @/MariaDB-10.1.18-centos7-x86_64-client
                                                                          170 M
 MariaDB-server                x86_64 10.1.18-1.el7.centos @/MariaDB-10.1.18-centos7-x86_64-server
                                                                          428 M
 git                           x86_64 2.10.0-1.gf.el7      @/git-2.10.0-1.gf.el7.x86_64
                                                                          2.4 M

[...]

Transaction Summary
================================================================================
Remove  36 Packages (+35 Dependent packages)

Installed size: 793 M
Is this ok [y/N]
```
　　列出了好多东西，看得笔者心花怒放，但是，诶？？？怎么*MariaDB*和*git*也要被一起删掉呢，仔细一看：
```nohighlight
# yum deplist Mariadb

Loaded plugins: fastestmirror, langpacks
Loading mirror speeds from cached hostfile
 * base: mirrors.tuna.tsinghua.edu.cn
 * extras: mirrors.tuna.tsinghua.edu.cn
 * updates: mirrors.tuna.tsinghua.edu.cn
package: mariadb.x86_64 1:5.5.50-1.el7_2

[...]

  dependency: mariadb-libs(x86-64) = 1:5.5.50-1.el7_2
   provider: mariadb-libs.x86_64 1:5.5.50-1.el7_2
  dependency: perl(Exporter)
   provider: perl-Exporter.noarch 5.68-3.el7
  dependency: perl(Fcntl)
   provider: perl.x86_64 4:5.16.3-286.el7
  dependency: perl(File::Temp)
   provider: perl-File-Temp.noarch 0.23.01-3.el7
  dependency: perl(Getopt::Long)
   provider: perl-Getopt-Long.noarch 2.40-2.el7
  dependency: perl(IPC::Open3)
   provider: perl.x86_64 4:5.16.3-286.el7
  dependency: perl(Sys::Hostname)
   provider: perl.x86_64 4:5.16.3-286.el7
```
　　原因找到了，因为MariaDB依赖了perl的某些组件，*perl-\**粗暴的把这些被依赖的组件包括在里面了，这该怎么办呢？

## 弯路

想了几个解决方案：

- **先一起删除，再重新安装**  
　　这个方法总有点向黑恶势力低头的感觉，最关键是的是，MariaDB是<u>跑着服务</u>的。否决。
{% asset_img bend_to_black.jpeg bend_to_black %}

- **忽略依赖关系强制删除**  
　　使用`yum remove XXX --nodepes`这样的必杀技，无视依赖关系强制删除，再使用`yum check`修复依赖关系，一种把人打个半死再治好的既视感。否决。  
　　yum官方也不资瓷这样的方法。[http://yum.baseurl.org/wiki/NoDeps](http://yum.baseurl.org/wiki/NoDeps)

- **修改yum**  
　　笔者一怒之下去 [yum.baseurl.org](yum.baseurl.org) 扒了源码下来，在`__init__.py`里的`remove()`看了半天，找不到足够优雅的切入点去改，于是放弃。。。

## 思路

　　就思路本身而言，其实很简单，举个栗子，需要删除foo-a、foo-b、foo-c三个软件包，但是需要保留bar-a，而bar-a依赖于bar-b，bar-b依赖于foo-b。  

匹配foo-\*匹配，得到：  
`A = [foo-a, foo-b, foo-c]`   
计算bar-a的依赖，得到：  
`B = [bar-a, bar-b, foo-b]`  
取其差集：  
`C = A - B = [foo-a, foo-c]`  
卸载C，是不会影响到bar-a的。

## 技术点


#### RepoQuery
官网介绍：[http://yum.baseurl.org/wiki/RepoQuery](http://yum.baseurl.org/wiki/RepoQuery)
>Repoquery is a yum-util that has an array of involved and complicated options. It is intended to be an analog to rpm -q commands but run on remote repositories. This accounts for why it is complicated and involved :)
> 
>Repoquery是一个包含高级选项的yum-util，它类似于rpm -q命令，但是涉及远程仓库，这也是它更复杂的原因 :)

```nohighlight
# repoquery  --help
Usage: repoquery [options]

Options:
  --version             show program's version number and exit
  -h, --help            show this help message and exit
  -l, --list            list files in this package/group
  -i, --info            list descriptive info from this package/group
  -f, --file            query which package provides this file
  --qf=QUERYFORMAT, --queryformat=QUERYFORMAT
                        specify a custom output format for queries
  --groupmember         list which group(s) this package belongs to
  -q, --query           no-op for rpmquery compatibility
  -a, --all             query all packages/groups
  -R, --requires        list package dependencies
  --provides            list capabilities this package provides
  --obsoletes           list other packages obsoleted by this package
  --conflicts           list capabilities this package conflicts with
  --changelog           show changelog for this package
  --location            show download URL for this package
  --nevra               show name-epoch:version-release.architecture info of
                        package
  --envra               show epoch:name-version-release.architecture info of
                        package
  --nvr                 show name, version, release info of package
  -s, --source          show package source RPM name
  --srpm                operate on corresponding source RPM
  --resolve             resolve capabilities to originating package(s)
  --alldeps             check non-explicit dependencies (files and Provides:)
                        as well, defaults to on
  --exactdeps           check dependencies exactly as given, opposite of
                        --alldeps
  --recursive           recursively query for packages (for whatrequires)
  --whatprovides        query what package(s) provide a capability
  --whatrequires        query what package(s) require a capability
  --whatobsoletes       query what package(s) obsolete a capability
  --whatconflicts       query what package(s) conflicts with a capability
  -g, --group           query groups instead of packages
  --grouppkgs=GROUPPKGS
                        filter which packages (all,optional etc) are shown
                        from groups
  --archlist=ARCHLIST   only query packages of certain architecture(s)
  --releasever=RELEASEVER
                        set value of $releasever in yum config and repo files
  --pkgnarrow=PKGNARROW
                        limit query to installed / available / recent /
                        updates / extras / all (available + installed) /
                        repository (default) packages
  --installed           limit query to installed pkgs only
  --show-duplicates     show all versions of packages
  --repoid=REPOID       specify repoids to query, can be specified multiple
                        times (default is all enabled)
  --enablerepo=ENABLEREPOS
                        specify additional repoids to query, can be specified
                        multiple times
  --disablerepo=DISABLEREPOS
                        specify repoids to disable, can be specified multiple
                        times
  --repofrompath=REPOFROMPATH
                        specify repoid & paths of additional repositories -
                        unique repoid and complete path required, can be
                        specified multiple times. Example.
                        --repofrompath=myrepo,/path/to/repo
  --plugins             enable yum plugin support
  --quiet               quiet output, only error output to stderr (default
                        enabled)
  --verbose             verbose output (opposite of quiet)
  -C, --cache           run from cache only
  --tempcache           use private cache (default when used as non-root)
  --querytags           list available tags in queryformat queries
  -c CONFFILE, --config=CONFFILE
                        config file location
  --level=TREE_LEVEL    levels to display (can be any number or 'all', default
                        to 'all')
  --output=OUTPUT       output format to use (can be text|ascii-tree|dot-tree,
                        default to 'text')
  --search              Use yum's search to return pkgs
  --search-fields=SEARCHFIELDS
                        search fields to search using --search
  --installroot=INSTALLROOT
                        set install root
  --setopt=SETOPTS      set arbitrary config and repo options
```
　　Repoquery就是`rpm -q`的高配版，用法很简单，在这里被用于查询依赖关系：  
  `repoquery --requires --resolve --pkgnarrow=installed --recursive bar`

- *--requires* 查找其依赖
- *--resolve* 将依赖(dependency)转换成包名(provider)
- *--pkgnarrow=installed* 只查找已安装的包
- *--recursive* 递归查找依赖

## 实现

　　笔者决定用最不擅长的一次就没写过的Python来解决问题，于是，在寒冷的冬夜里，在公司默默加班奋斗，一边查资料一边写脚本。
> Talk is cheap. Show me the code.

```Python
#!/usr/bin/python
# -*- coding: UTF-8 -*-

from __future__ import print_function
from __future__ import unicode_literals

import sys, getopt
import commands
import re
import subprocess

def main(argv):

    # get options from arguments
    try:
        opts, args = getopt.getopt(argv,"he:x:v",["help", "exclude="])
    except getopt.GetoptError as err:
        print(str(err))
        usage()
        sys.exit(2)

    remove_package = ''
    exclude_package = ''
    verbose = False
    for opt, arg in opts:
        if opt in ('-h', 'help'):
            usage()
            sys.exit()
        elif opt in ('-e'):
            remove_package = arg
        elif opt in ('-x', '--exclude'):
            exclude_package = arg
        elif opt in ('-v'):
            verbose = True

    if remove_package == '' or exclude_package == '':
        print('wrong arvs!')
        usage()
        sys.exit(2)


    # get exclude packages
    print('analyzing exclude packages and their dependencies ...')
    (status, output) = commands.getstatusoutput('repoquery --requires --resolve --pkgnarrow=installed --recursive '+ exclude_package)
    deplist = set()
    for line in output.splitlines():
        deplist.add(line)
    if verbose:
        print('exclude packages:\n'+'\n'.join(deplist))
    print('')


    # get packages to remove
    print('analyzing packages which will be removed...')
    removelist = set()
    (status, output) = commands.getstatusoutput('repoquery --pkgnarrow=installed '+ remove_package)
    for line in output.splitlines():
        if not line in deplist:
            removelist.add(line)
            if verbose:
                print('passed: '+line)
        else:
            if verbose:
                print('skiped: '+line)
    print('')


    if len(removelist) < 1:
        print('Nothing to remove!')
        sys.exit(0)
    pipe = subprocess.Popen('yum remove '+ ' '.join(removelist), stdin = sys.stdin, stdout = sys.stdout, shell=True)
    pipe.communicate()

def usage():
    print('remove.py -e <remove_package> -x <exclude_package>')
    print('example: remove.py -e perl-* -x \'mysql* git*\'')

if __name__ == "__main__":
   main(sys.argv[1:])
```

*这是笔者的处女Python啊!!!*  
*这是笔者的处女Python啊!!!*  
*这是笔者的处女Python啊!!!*  
*多年的强迫症加重了!!!*