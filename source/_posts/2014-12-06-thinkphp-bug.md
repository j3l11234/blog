---
title: 解决ThinkPHP模版中条件表达式的匹配问题
date: 2014-12-06 18:06:44
updated: 2014-12-06 18:06:44
tags:
---
　　前几天弄项目发现这个问题，在模版文件中，`$apply`是一个数组，但是总是匹配不上。  
<!-- more -->
　　模版的代码如下:
```PHP
<if condition="$plist.name eq $apply.plan_province">
    <option value="$plist.name">{$plist.name}</option>
</if>;
```
　　经过查看Runtime里的编译模版，发现condition表达式转换成了：    
`condition="$plist["name"] == $apply.plan_province"`  
　　然而我们期望的是替换为：  
 `condition="$plist["name"] == $apply['plan_province']"`
 
　　问题出现在这里，`eq`后边的变量`$apply.plan_province`并没有被转换为`$apply['plan_province']`，经过跟踪发现是`ThinkPHP/Library/Think/Template/TagLib.class.php`中的代码导致了这个问题。
```
```PHP
/**
     * 解析条件表达式
     * @access public
     * @param string $condition 表达式标签内容
     * @return array
*/
public function parseCondition($condition) {
    $condition = str_ireplace(array_keys($this->comparison),array_values($this->comparison),$condition);
    $condition = preg_replace('/$(w+):(w+)s/is','$\1->\2 ',$condition);
    switch(strtolower(C('TMPL_VAR_IDENTIFY'))) {
        case 'array': // 识别为数组
            $condition = preg_replace('/$(w+).(w+)s/is','$\1["\2"] ',$condition);
            break;
        case 'obj':  // 识别为对象
            $condition = preg_replace('/$(w+).(w+)s/is','$\1->\2 ',$condition);
                break;
            default:  // 自动判断数组或对象 只支持二维
                $condition = preg_replace('/$(w+).(w+)s/is','(is_array($\1)?$\1["\2"]:$\1->\2) ',$condition);
   }
    if(false !== strpos($condition, '$Think'))
        $condition = preg_replace_callback('/($Think.*?)s/is', array($this, 'parseThinkVar'), $condition);
    return $condition;
}
```
　　根据`$condition = preg_replace('/$(w+).(w+)s/is','$\1["\2"] ',$condition)` 大概可以猜出来，里面的“s”表示要匹配一个空格，比如`[$plist.name ]`就可以匹配到，`[$apply.plan_province]`就不行，当然了，在表达式后面加一个空格，可以解决问题： 

```PHP
<if condition="$plist.name eq $apply.plan_province ">
    <option value="$plist.name">{$plist.name}</option>
</if>;
```
 
　　不过呢，这样确实不爽，于是我改了一下，吧`s`变成`(s|$)`,也就是匹配空格或者是匹配结尾，然后变成这样  
```PHP
/**
     * 解析条件表达式
     * @access public
     * @param string $condition 表达式标签内容
     * @return array
*/
public function parseCondition($condition) {
    $condition = str_ireplace(array_keys($this->comparison),array_values($this->comparison),$condition);
    $condition = preg_replace('/$(w+):(w+)s/is','$\1->\2 ',$condition);
    switch(strtolower(C('TMPL_VAR_IDENTIFY'))) {
        case 'array': // 识别为数组
            $condition = preg_replace('/$(w+).(w+)(s|$)/is','$\1["\2"] ',$condition);
            break;
        case 'obj':  // 识别为对象
            $condition = preg_replace('/$(w+).(w+)(s|$)/is','$\1->\2 ',$condition);
                break;
            default:  // 自动判断数组或对象 只支持二维
                $condition = preg_replace('/$(w+).(w+)(s|$)/is','(is_array($\1)?$\1["\2"]:$\1->\2) ',$condition);
   }
    if(false !== strpos($condition, '$Think'))
        $condition = preg_replace_callback('/($Think.*?)(s|$)/is', array($this, 'parseThinkVar'), $condition);
    return $condition;
}
```
  
　　这样不用在末尾加空格也可以解决问题。  
[https://github.com/liu21st/thinkphp/pull/219](https://github.com/liu21st/thinkphp/pull/219)  
 已经提交上github。。。等合并


