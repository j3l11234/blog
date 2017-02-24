---
title: CentOS下fail2ban安装与配置教程
date: 2015-09-21 02:34:16
updated: 2015-09-21 02:34:16
tags:
---
## 介绍

fail2ban用于监视系统日志，通过正则表达式匹配错误错误信息，设置一定的条件触发相应的屏蔽动作。  
 在笔者的vps里，主要是用于ssh的保护，ssh登录错误的时候会记录到 **/var/log/secure**，fail2ban通过 gamin检测到新增日志，10min内同一ip连续登陆5次就会封禁30min。  
 当然，一个足够的强密码也是必须的！

<!-- more -->

官方主页：[http://www.fail2ban.org/wiki/index.php/Main_Page](http://www.fail2ban.org/wiki/index.php/Main_Page)

github：[https://github.com/fail2ban/fail2ban](https://github.com/fail2ban/fail2ban)


## 安装

 这里有两种安装方式，使用yum安装或者通过rpm安装。笔者的系统版本是CentOS-6.7

- yum安装

```
#首先安装epel源，如果已经安装可以跳过此步
yum install -y epel-release

#然后安装fail2ban：
yum install -y fail2ban
```

- rpm安装

fail2ban依赖下面四个安装包：  
**ed**： Linux 操作系统下最简单的文本编辑器，以行为单位对文件进行编辑  
**gamin-python**： python调用gamin的一个模块，gamin实现了一套监控文件变化的机制  
**ipset**： 管理 ip地址/端口/mac地址 的模块，一般用于辅助提高iptables的性能  
**python-inotify**： python的一个模块，实现了文件变化通知机制

```
#其中前三个都可以使用yum安装：
yum -y install ed gamin-python ipset python-inotify

#然后根据系统架构不同，使用不同的rpm包安装：
#i386
rpm -Uvh ftp://rpmfind.net/linux/atrpms/el6-i386/atrpms/stable/python-inotify-0.9.1-1.1.el6.noarch.rpm
rpm -Uvh ftp://rpmfind.net/linux/epel/testing/6/i386/fail2ban-0.9.3-1.el6.noarch.rpm

#x86-64
rpm -Uvh ftp://rpmfind.net/linux/atrpms/el6-x86_64/atrpms/stable/python-inotify-0.9.1-1.1.el6.noarch.rpm
rpm -Uvh ftp://rpmfind.net/linux/epel/testing/6/x86_64/fail2ban-0.9.3-1.el6.noarch.rpm
```


## 配置

目前的最新版本是0.9.3

```
配置文件位于：
/etc/fail2ban/action.d/ //采取相对应措施的目录
/etc/fail2ban/fail2ban.conf //fail2ban的配置文件
/etc/fail2ban/fail2ban.d/ //fail2ban的配置文件目录
/etc/fail2ban/filter.d/ //具体过滤规则文件目录
/etc/fail2ban/jail.conf //阻挡设定文件
/etc/fail2ban/jail.d/ //阻挡设定文件的目录
/etc/fail2ban/paths-*.conf //不同linux发行版下路径的相关设置，在jail.conf的[INCLUDES]里指定
```

**fail2ban.conf** 是针对fail2ban程序运行本身的一些设置。  
**jail.conf** 是fail2ban的业务功能设置，里面设置了需要监控那些服务以及如何保护等，里边已经针对常用的服务提供了监控方案，比如sshd、apache、3proxy等，笔者只启用了sshd的保护。

jail.conf里的注释十分丰富，简单介绍一些基本的设置：

```
#所有监控项的默认设置
[DEFAULT]
#忽略的ip，这里表示本机ip将永不被封禁
ignoreip = 127.0.0.1/8
#封禁时间，单位为秒
bantime = 600

#监控周期，表示在600s内，失败次数达到maxretry的主机将会被封禁
findtime = 600

#最大重试次数，表示在findtime内，失败次数达到5次的主机将会被封禁
maxretry = 5

#默认关闭对所有服务的保护
enabled = false
```

启用sshd的保护很简单，在jail.conf的[sshd]中加上一行**enabled = true**就可以：

```
# SSH servers
#

[sshd]

port = ssh
logpath = %(sshd_log)s
enabled = true
```

最后就是设置服务自启动了

```
chkconfig fail2ban on
service fail2ban start
```


## FAQ

Q：日志中出现**Error starting action**错误

```
fail2ban.server[2228]: INFO Jail sshd is not a JournalFilter instance
fail2ban.jail[2228]: INFO Jail 'sshd' started
fail2ban.action[2228]: ERROR iptables -w -N f2b-sshd#012iptables -w -A f2b-sshd -j RETURN#012iptables -w -I INPUT -p tcp -m multiport --dports ssh -j f2b-sshd -- stdout: ''
fail2ban.action[2228]: ERROR iptables -w -N f2b-sshd#012iptables -w -A f2b-sshd -j RETURN#012iptables -w -I INPUT -p tcp -m multiport --dports ssh -j f2b-sshd -- stderr: ''
fail2ban.action[2228]: ERROR iptables -w -N f2b-sshd#012iptables -w -A f2b-sshd -j RETURN#012iptables -w -I INPUT -p tcp -m multiport --dports ssh -j f2b-sshd -- returned 2
fail2ban.actions[2228]: ERROR Failed to start jail 'sshd' action 'iptables-multiport': Error starting action
```

A：fail2ban-0.9.3在执行iptable命令时，加上了-w参数用于防止冲突，但是iptables-1.4.20才有这个参数，而CentOS6.7下的是iptables-1.4.7,因此导致iptable的命令执行失败，Github有这个问题：  
[https://github.com/fail2ban/fail2ban/issues/1122](https://github.com/fail2ban/fail2ban/issues/1122)

一个折中方案是，修改/etc/fail2ban/action.d/iptables-common.conf文件，去掉**<lockingopt>**，也就是-w参数：

```
# Option: iptables
# Notes.: Actual command to be executed, including common to all calls options
# Values: STRING
#iptables = iptables <lockingopt>
iptables = iptables
```

Q：日志中出现**ERROR findFailure failed to parse timeText**错误：

```
Sep 21 09:57:51 12345 fail2ban.filter[1588]: ERROR findFailure failed to parse timeText: Sep 21 09:57:26 1234

#在fail2ban-0.9.2 是这样的错误
Sep 21 10:05:37 12345 fail2ban.filterpyinotify[1305]: ERROR Error in FilterPyinotify callback: mktime argument out of range
```

A：这个错误源于一个不算bug的bug，当用户的hostname前面为数字的时候就会触发

```
[root@12345 ~]# hostname
12345.domain.com
```

在日志中，**12345.domain.com**前面的**12345**被当作是年份被解析了，笔者的vps很不幸，hostname就是数字开头的，而且当时的版本还是fail2ban-0.9.2，排错过程十分辛苦。  
 解决的方法有很多，比如最直接的修改hostname

```
vi /etc/sysconfig/network
```

而笔者采用的方案是修改 rsyslog 的日志格式：

```
vi /etc/rsyslog.conf

# Use default timestamp format
#$ActionFileDefaultTemplate RSYSLOG_TraditionalFileFormat
$template FileFormat,"%TIMESTAMP:::date-rfc3339% %HOSTNAME% %syslogtag%%msg:::sp-if-no-1st-sp%%msg:::drop-last-lf%\n"
$ActionFileDefaultTemplate FileFormat
```

重启 rsyslog 服务

```
service rsyslog restart
```

关于rsyslog日志格式的说明：  
[http://www.rsyslog.com/doc/v8-stable/configuration/templates.html#reserved-template-names](http://www.rsyslog.com/doc/v8-stable/configuration/templates.html#reserved-template-names)


