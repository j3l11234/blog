---
title: Nginx以url前缀作为虚拟主机
date: 2016-09-19 01:04:07
updated: 2017-02-27 21:04:13
tags:
---
## 需求

仅通过IP或者单一域名访问的情况下，根据不同的url前缀，指向不同的根目录。给用户的感觉是访问了不同的站点。

例如`http://localhost/aaa`则访问站点a，`http://localhost/bbb`则访问站点b，`http://localhost/aaa/ccc`则访问站点c

## 真正的Vhost

真正意义上Vhost，是使用域名作为区分。也就是`server_name`字段。这类配置方式广为人知。
```
server {
    listen       80;
    server_name  www.aaa.com;

    charset utf-8;
    access_log  /var/log/nginx/log/aaa.access.log  main;

    location / {
        root   /www/aaa;
        index  index.html index.htm;
    }
}

server {
    listen       80;
    server_name  www.bbb.com;

    charset utf-8;
    access_log  /var/log/nginx/log/bbb.access.log  main;

    location / {
        root   /www/bbb;
        index  index.html index.htm;
    }
}
```

## URL前缀区分

要通过url前缀区来区分站点，本质上还是通过配置多级`location`来实现，顶层使用`location ^~ `作为区分，里面有独立的`access_log`策略，有嵌套的`location`作为动态静态控制。

不过笔者在实践的时候，还是遇到了一些小坑。

### root还是alias

根据官方讲义
http://nginx.org/en/docs/http/ngx_http_core_module.html#alias

```
location /images/ {
    alias /data/w3/images/;
}

# or

location /images/ {
    root /data/w3;
}
```
使用两个配置，在访问`lcoalhost/images/a.jpg`时，最终读取的都是`/data/w3/images/a.jpg`。
使用`root`，`location`后的URI也会一并包含在访问路径中，`/data/w3/`+`images/a.jpg`。
使用`alias`，`location`后的URI不回包含在访问路径中，`/data/w3/images/`+`a.jpg`。

`alias`还可以实现如下的高级用法，不过`alias`的路径一定要有`/`结尾，不然就妥妥的404吧。
```
location ~ ^/users/(.+\.(?:gif|jpe?g|png))$ {
    alias /data/w3/images/$1;
}
```

### 不带斜杠的情况
访问`http://localhost/aaa`和`http://localhost/aaa/`的时候，都应该视为访问站点a。这里针对`/aaa`做了跳转的处理方式
```
location = /aaa {
    rewrite /aaa /aaa/ permanent;
}
```

### 嵌套路径
针对`http://localhost/aaa/ccc`指向站点c的情况。需要使用`location ^~`前缀匹配的方式，因为nginx在进行location匹配的时候，会寻找尽可能匹配的情况，这于先后顺序无关。
比如，访问`http://localhost/aaa/ccc`会匹配到下一条。

```
location ^~ /aaa/ {
    ...
}

location ^~ /aaa/ccc {
    ...
}
```

### PHP
通过fastcgi访问php时。`$fastcgi_script_name`将被赋值成URI，或者是URI+`/index.php`。
在访问`http://localhost/aaa/`时，`$fastcgi_script_name`为`/aaa/index.php`，但`aaa`是不应出现在变量中，否则会导致路径错误。

我们使用`fastcgi_split_path_info`对URI进行处理，略去`aaa`前缀部分，并设置正确的`SCRIPT_FILENAME`。
```
location ~ ^/aaa/(.+\.php)(.*)$ {
    fastcgi_pass   127.0.0.1:9000;
    fastcgi_index  index.php;
    fastcgi_split_path_info       ^/aaa/(.+\.php)(.*)$;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_param PATH_INFO       $fastcgi_path_info;
    include        fastcgi_params;
}
```
这样，对于`SCRIPT_FILENAME`和`SCRIPT_NAME`，都可以将其设置为正确值。

参考讲义
http://nginx.org/en/docs/http/ngx_http_fastcgi_module.html#variables
http://nginx.org/en/docs/http/ngx_http_fastcgi_module.html#fastcgi_split_path_info

## 成品

```
server {
    listen       80;
    server_name  localhost;

    charset utf-8;
    access_log off;
    error_log  off;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }

    #============================================================
    #   aaa
    #============================================================
    location = /aaa {
        rewrite /aaa /aaa/ permanent;
    }

    location ^~ /aaa/ {
        alias   /www/aaa/;
        index   index.php;
        
        access_log /var/log/nginx/log/aaa.access.log  main;
        error_log  /var/log/nginx/log/aaa.error.log;

        if (!-e $request_filename){  
            rewrite ^/(.*) /aaa/index.php last;  
        } 

        location ~ ^/aaa/(.+\.php)(.*)$ {
            fastcgi_pass   127.0.0.1:9000;
            fastcgi_index  index.php;
            fastcgi_split_path_info       ^/aaa/(.+\.php)(.*)$;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            fastcgi_param PATH_INFO       $fastcgi_path_info;
            include        fastcgi_params;
        }
    }

    #============================================================
    #   bbb
    #============================================================
    location = /bbb {
        rewrite /bbb /bbb/ permanent;
    }

    location ^~ /bbb/ {
        alias   /www/bbb/;
        index   index.php;

        access_log /var/log/nginx/log/bbb.access.log  main;
        error_log  /var/log/nginx/log/bbb.error.log;

        location ~ ^/bbb/(.+\.php)(.*)$ {
            fastcgi_pass   127.0.0.1:9000;
            fastcgi_index  index.php;
            fastcgi_split_path_info       ^/bbb/(.+\.php)(.*)$;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            fastcgi_param PATH_INFO       $fastcgi_path_info;
            include        fastcgi_params;
        }
    }

    #============================================================
    #   ccc
    #============================================================
    location = /aaa/ccc {
        rewrite /aaa/ccc /aaa/ccc/ permanent; 
    }

    location ^~ /aaa/ccc/ {
        alias   /www/ccc/;
        index   index.php;
        
        access_log /var/log/nginx/log/ccc.access.log  main;
        error_log  /var/log/nginx/log/ccc.error.log;

        if (!-e $request_filename){  
            rewrite ^/(.*) /aaa/ccc/index.php last;  
        } 

        location ~ ^/aaa/ccc/(.+\.php)(.*)$ {
            fastcgi_pass   127.0.0.1:9000;
            fastcgi_index  index.php;
            fastcgi_split_path_info       ^/aaa/ccc/(.+\.php)(.*)$;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            fastcgi_param PATH_INFO       $fastcgi_path_info;
            include        fastcgi_params;
        }
    }
}
```

