---
title: 改变Hyper-v下Centos7的默认分辨率
date: 2016-09-12 13:55:31
updated: 2016-09-12 13:55:31
tags:
---

vi /etc/default/grub
```
GRUB_CMDLINE_LINUX=”crashkernel=auto rd.lvm.lv=centos/root rd.lvm.lv=centos/swap rhgb quiet splash video=hyperv_fb:800×600″
```
save.

```
grub2-mkconfig -o /boot/grub2/grub.cfg
```

