---
title: React源码——常见工具类
date: 2017-02-28 21:47:04
tags:
  - React
  - JavaScript
category: 
keywords: React,PooledClass,CallbackQueue
---
## 介绍

最近读起了React源码，React实现太过巧妙，底层有许多有用的工具类，了解这些工具类的常用使用方法，在读源码的时候可以更好更快的理解。

### Flow
Flow 是 Facebook 宣布推出一个开源的 JavaScript 静态类型检查器，旨在发现 JS 程序中的类型错误，以提高程序员的效率和代码质量。React源码使用了Flow。
参考网址： https://flowtype.org/

<!-- more -->

## PooledClass

### 简介
PooledClass是React的基本类库，见字如面，用于将常用类做一个缓冲池，将常用类的实例缓存在内存中，省略其实例化和释放的开销。

### 用法
```javascript
var PooledClass = require('PooledClass');

class Foo {
  constructor(arg) {
    this.arg = arg;
  }

  destructor() {
    this.arg = null;
  }
}

//初始化，绑定缓存池
PooledClass.addPoolingTo(Foo);

//从池中取出一个实例
let foo = Foo.getPooled("foo");
//执行constructor
//foo.arg = "foo"

//释放实例，将实例放回池中
Foo.release(foo);
//执行destructor();

```

### 源码分析
https://github.com/facebook/react/blob/15-stable/src/shared/utils/PooledClass.js

`addPoolingTo()`方法有两个参数，`CopyConstructor`为类的构造器，是一个function对象；`pooler`负责类的初始化，默认为下文的`oneArgumentPooler`。
`addPoolingTo()`给这个function对象添加了`instancePool`用于缓存实例；`poolSize`用于指示缓存池大小；`getPooled()`用于取出实例；`release()`用于放回实例。
``` javascript
var DEFAULT_POOL_SIZE = 10;
var DEFAULT_POOLER = oneArgumentPooler;

/**
 * Augments `CopyConstructor` to be a poolable class, augmenting only the class
 * itself (statically) not adding any prototypical fields. Any CopyConstructor
 * you give this may have a `poolSize` property, and will look for a
 * prototypical `destructor` on instances.
 *
 * @param {Function} CopyConstructor Constructor that can be used to reset.
 * @param {Function} pooler Customizable pooler.
 */
var addPoolingTo = function<T>(
  CopyConstructor: Class<T>,
  pooler: Pooler,
): Class<T> & {
  getPooled(/* arguments of the constructor */): T,
  release(): void,
} {
  // Casting as any so that flow ignores the actual implementation and trusts
  // it to match the type we declared
  var NewKlass = (CopyConstructor: any);
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};
```

`oneArgumentPooler()`对应`getPooled()`，从缓存池中取出实例并初始化，如果缓存池为空，则使用new新建一个实例并初始化。 除此之外还有`twoArgumentPooler`、`threeArgumentPooler`、`fourArgumentPooler`函数，对应有多个构造函数的情况。尽管他们可以用一个通用的方法实现，但是这样需要访问`arguments`对象。
`standardReleaser()`对应`release()`，执行实例的`destructor()`后，如果缓存池未满则将实例放入缓存池。
``` javascript
/**
 * Static poolers. Several custom versions for each potential number of
 * arguments. A completely generic pooler is easy to implement, but would
 * require accessing the `arguments` object. In each of these, `this` refers to
 * the Class itself, not an instance. If any others are needed, simply add them
 * here, or in their own files.
 */
var oneArgumentPooler = function(copyFieldsFrom) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, copyFieldsFrom);
    return instance;
  } else {
    return new Klass(copyFieldsFrom);
  }
};

...

var standardReleaser = function(instance) {
  var Klass = this;
  invariant(
    instance instanceof Klass,
    'Trying to release an instance into a pool of a different type.'
  );
  instance.destructor();
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
};
```

---

## CallbackQueue

### 简介
CallbackQueue用于批量存储回调函数，并在合适的时候触发。是一个伪事件模块，用于记录那些等待着被通知的组件，当组件的DOM代表可用的时候将会被通知。

### 用法
``` javascript
var CallbackQueue = require('CallbackQueue');

//获取实例
var queue = CallbackQueue.getPooled();
//已经调用PooledClass.addPoolingTo(CallbackQueue);


var foo = {
    bar: 0
}
var plusBar = function() {
    if (typeof(this.bar) !== "undefined")
        this.bar++;
}

//初始化
queue.reset();
//将回调加入队列，第二个参数指定作用域
queue.enqueue(plusBar, foo);
queue.enqueue(plusBar, foo);
//调用所有回调
queue.notifyAll();

console.log(foo.bar);
//输出2，plusBar()作用域为foo

//释放实例
CallbackQueue.release(this.callbackQueue);
```

### 源码解析
https://github.com/facebook/react/blob/15-stable/src/renderers/shared/utils/CallbackQueue.js

CallbackQueue包含三个成员属性，`_callbacks`、`_contexts`、`_arg`，分别储存回调的函数、作用域、参数。
- `enqueue(callback, context)`：将一个回调函数及其作用域压入数组。
- `notifyAll()`：依次触发所有回调函数，使用对应的作用域，使用`_arg`作为参数。调用完成后清空回调队列，`Array.length = 0;`用于清空队列数组，避免内存泄露。
- `checkpoint()`: 获取一个检查点，返回队列长度。
- `rollback(len)`: 恢复检查点对应状态，参数为队列长度。
- `reset()`: 重置队列，将回调队列及其作用域`_callbacks`、`_contexts`清空，但是不会清空`_arg`。
最后一行`module.exports = PooledClass.addPoolingTo(CallbackQueue);`，给CallbackQueue做了线程池处理。

``` javascript
/**
 * A specialized pseudo-event module to help keep track of components waiting to
 * be notified when their DOM representations are available for use.
 *
 * This implements `PooledClass`, so you should never need to instantiate this.
 * Instead, use `CallbackQueue.getPooled()`.
 *
 * @class ReactMountReady
 * @implements PooledClass
 * @internal
 */
class CallbackQueue<T> {
  _callbacks: ?Array<() => void>;
  _contexts: ?Array<T>;
  _arg: ?mixed;

  constructor(arg) {
    this._callbacks = null;
    this._contexts = null;
    this._arg = arg;
  }

  /**
   * Enqueues a callback to be invoked when `notifyAll` is invoked.
   *
   * @param {function} callback Invoked when `notifyAll` is invoked.
   * @param {?object} context Context to call `callback` with.
   * @internal
   */
  enqueue(callback: () => void, context: T) {
    this._callbacks = this._callbacks || [];
    this._callbacks.push(callback);
    this._contexts = this._contexts || [];
    this._contexts.push(context);
  }

  /**
   * Invokes all enqueued callbacks and clears the queue. This is invoked after
   * the DOM representation of a component has been created or updated.
   *
   * @internal
   */
  notifyAll() {
    var callbacks = this._callbacks;
    var contexts = this._contexts;
    var arg = this._arg;
    if (callbacks && contexts) {
      invariant(
        callbacks.length === contexts.length,
        'Mismatched list of contexts in callback queue'
      );
      this._callbacks = null;
      this._contexts = null;
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i].call(contexts[i], arg);
      }
      callbacks.length = 0;
      contexts.length = 0;
    }
  }

  checkpoint() {
    return this._callbacks ? this._callbacks.length : 0;
  }

  rollback(len: number) {
    if (this._callbacks && this._contexts) {
      this._callbacks.length = len;
      this._contexts.length = len;
    }
  }

  /**
   * Resets the internal queue.
   *
   * @internal
   */
  reset() {
    this._callbacks = null;
    this._contexts = null;
  }

  /**
   * `PooledClass` looks for this.
   */
  destructor() {
    this.reset();
  }
}

module.exports = PooledClass.addPoolingTo(CallbackQueue);
```

## Transaction

### 简介
Transaction是React的一个亮点。
`Transaction`创造了一个可以包裹任何方法的黑盒，使得在调用方法的之前和之后，可以保持一些不变量(即使在方法的调用过程中抛出了异常)，在任何需要实例化一个transaction的地方，都可以在构造时提供处理这些不变量的实施函数。`Transaction`类自身会提供一个附加的invariant，使得transaction实例已经处于运行过程中时不会再次运行。通常构造一个`Transaction`的单例然后多次重用，可用于包裹几个不同的方法。wrapper非常简单，只需要实现两个方法`initialize()`和`close()`。
在执行`perform(method)`之前，每个wrapper的`initialize()`会依次执行并记录返回值，在执行`perform(method)`之后，每个wrapper的`close()`会依次执行，之前记录的返回值会作为`close()`的参数。
<pre>
                       wrappers (injected at creation time)
                                      +        +
                                      |        |
                    +-----------------|--------|--------------+
                    |                 v        |              |
                    |      +---------------+   |              |
                    |   +--|    wrapper1   |---|----+         |
                    |   |  +---------------+   v    |         |
                    |   |          +-------------+  |         |
                    |   |     +----|   wrapper2  |--------+   |
                    |   |     |    +-------------+  |     |   |
                    |   |     |                     |     |   |
                    |   v     v                     v     v   | wrapper
                    | +---+ +---+   +---------+   +---+ +---+ | invariants
 perform(anyMethod) | |   | |   |   |         |   |   | |   | | maintained
 +----------------->|-|---|-|---|-->|anyMethod|---|---|-|---|-|-------->
                    | |   | |   |   |         |   |   | |   | |
                    | |   | |   |   |         |   |   | |   | |
                    | |   | |   |   |         |   |   | |   | |
                    | +---+ +---+   +---------+   +---+ +---+ |
                    |  initialize                    close    |
                    +-----------------------------------------+
 </pre>

### 用法
``` javascript
var Transaction = require('Transaction');

class FooTransaction {
  constructor() {
    this.count = 0;
  }
}

var TRANSACTION_WRAPPERS = [{
  initialize: function() {
    console.log('initialize()');
    return this.count;
  },
  close: function(priorCount) {
    console.log('close()');
    this.count = priorCount + 1;
  },
}];

Object.assign(
  FooTransaction.prototype,
  Transaction,
  {
    getTransactionWrappers: function() {
      return TRANSACTION_WRAPPERS;
    },
  }
);

var someMethod = function(arg1, arg2) {
  console.log(this);
  console.log(arg1);
  console.log(arg2);
}

var fooTransaction = new FooTransaction();
fooTransaction.reinitializeTransaction(); //初始化

console.log(fooTransaction.count); //输出0
fooTransaction.perform(someMethod, null, 1, 2);
//输出"initialize()"
//输出全局Window、1、2
//输出"close()"
console.log(fooTransaction.count); //输出1
```

### 源码分析
https://github.com/facebook/react/blob/15-stable/src/renderers/shared/utils/Transaction.js

``` javascript
isInTransaction: function(): boolean {
  return !!this._isInTransaction;
},

/**
 + Executes the function within a safety window. Use this for the top level
 + methods that result in large amounts of computation/mutations that would
 + need to be safety checked. The optional arguments helps prevent the need
 + to bind in many cases.
 *
 + @param {function} method Member of scope to call.
 + @param {Object} scope Scope to invoke from.
 + @param {Object?=} a Argument to pass to the method.
 + @param {Object?=} b Argument to pass to the method.
 + @param {Object?=} c Argument to pass to the method.
 + @param {Object?=} d Argument to pass to the method.
 + @param {Object?=} e Argument to pass to the method.
 + @param {Object?=} f Argument to pass to the method.
 *
 + @return {*} Return value from `method`.
 */
perform: function<
  A, B, C, D, E, F, G,
  T: (a: A, b: B, c: C, d: D, e: E, f: F) => G // eslint-disable-line space-before-function-paren
>(
  method: T, scope: any,
  a: A, b: B, c: C, d: D, e: E, f: F,
): G {
  invariant(
    !this.isInTransaction(),
    'Transaction.perform(...): Cannot initialize a transaction when there ' +
    'is already an outstanding transaction.'
  );
  var errorThrown;
  var ret;
  try {
    this._isInTransaction = true;
    // Catching errors makes debugging more difficult, so we start with
    // errorThrown set to true before setting it to false after calling
    // close -- if it's still set to true in the finally block, it means
    // one of these calls threw.
    errorThrown = true;
    this.initializeAll(0);
    ret = method.call(scope, a, b, c, d, e, f);
    errorThrown = false;
  } finally {
    try {
      if (errorThrown) {
        // If `method` throws, prefer to show that stack trace over any thrown
        // by invoking `closeAll`.
        try {
          this.closeAll(0);
        } catch (err) {
        }
      } else {
        // Since `method` didn't throw, we don't want to silence the exception
        // here.
        this.closeAll(0);
      }
    } finally {
      this._isInTransaction = false;
    }
  }
  return ret;
},

initializeAll: function(startIndex: number): void {
  var transactionWrappers = this.transactionWrappers;
  for (var i = startIndex; i < transactionWrappers.length; i++) {
    var wrapper = transactionWrappers[i];
    try {
      // Catching errors makes debugging more difficult, so we start with the
      // OBSERVED_ERROR state before overwriting it with the real return value
      // of initialize -- if it's still set to OBSERVED_ERROR in the finally
      // block, it means wrapper.initialize threw.
      this.wrapperInitData[i] = OBSERVED_ERROR;
      this.wrapperInitData[i] = wrapper.initialize ?
        wrapper.initialize.call(this) :
        null;
    } finally {
      if (this.wrapperInitData[i] === OBSERVED_ERROR) {
        // The initializer for wrapper i threw an error; initialize the
        // remaining wrappers but silence any exceptions from them to ensure
        // that the first error is the one to bubble up.
        try {
          this.initializeAll(i + 1);
        } catch (err) {
        }
      }
    }
  }
},

/**
 + Invokes each of `this.transactionWrappers.close[i]` functions, passing into
 + them the respective return values of `this.transactionWrappers.init[i]`
 + (`close`rs that correspond to initializers that failed will not be
 + invoked).
 */
closeAll: function(startIndex: number): void {
  invariant(
    this.isInTransaction(),
    'Transaction.closeAll(): Cannot close transaction when none are open.'
  );
  var transactionWrappers = this.transactionWrappers;
  for (var i = startIndex; i < transactionWrappers.length; i++) {
    var wrapper = transactionWrappers[i];
    var initData = this.wrapperInitData[i];
    var errorThrown;
    try {
      // Catching errors makes debugging more difficult, so we start with
      // errorThrown set to true before setting it to false after calling
      // close -- if it's still set to true in the finally block, it means
      // wrapper.close threw.
      errorThrown = true;
      if (initData !== OBSERVED_ERROR && wrapper.close) {
        wrapper.close.call(this, initData);
      }
      errorThrown = false;
    } finally {
      if (errorThrown) {
        // The closer for wrapper i threw an error; close the remaining
        // wrappers but silence any exceptions from them to ensure that the
        // first error is the one to bubble up.
        try {
          this.closeAll(i + 1);
        } catch (e) {
        }
      }
    }
  }
  this.wrapperInitData.length = 0;
},
```