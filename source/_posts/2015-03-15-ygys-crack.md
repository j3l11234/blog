---
title: 愚公移山2Android版金币内购破解
date: 2015-03-15 16:08:21
updated: 2015-03-15 16:08:21
tags:
---

╮(╯_╰)╭  
 貌似最近，愚公移山2出来了呢，百度了半天都没有破解内购的，于是心血来潮。。。。

国际惯例。。反编译  
{% asset_img ygys-crack_1.jpg ygys-crack_1 %}

发现了3大运营商的内购sdk，分别是电信，联通，移动。  
{% asset_img ygys-crack_2.jpg ygys-crack_2 %}

经过分析后，发现三大运营商的支付，由HTMobilePayment负责，调用里面的doPay函数，同时传入一个HTMPPayListener作为参数，在doPay里将HTMPPayListener传入对应的付费sdk，当支付完成时，调用HTMPPayListener的onHTPayCompleted()。  
{% asset_img ygys-crack_3.jpg ygys-crack_3 %}

{% asset_img ygys-crack_4.jpg ygys-crack_4 %}  
 NOTE：付费sdk往往使用回调函数的形式，比如移动用的是OnPurchaseListener的onBillingFinish()，找到实现它的类就可以看到支付成功后是怎么一回事  
 这里有smail的指令，看熟练之后其实和看源代码差不多[http://blog.csdn.net/xiaotian15/article/details/8538406](http://blog.csdn.net/xiaotian15/article/details/8538406)

于是，我们跳过doPay的调用，直接调用onHTPayCompleted()。  
{% asset_img ygys-crack_5.jpg ygys-crack_5 %}

重编译  
{% asset_img ygys-crack_6.jpg ygys-crack_6 %}

由于我们只是改了smail的指令，把编译出的apk里的classes.dex提取出来，替换进原版的apk里即可，最后别忘了重新签名，否则是不能安装的。  
{% asset_img ygys-crack_7.jpg ygys-crack_7 %}

恩，最后是留给伸手党的= =  
[http://pan.baidu.com/s/1o6qRIOU](http://pan.baidu.com/s/1o6qRIOU)  
 elg3


