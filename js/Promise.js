//该文件模拟原生Promise

(function(){

	const PENDING = 'pending' //定义常量，存储初始化状态字符
	const RESOLVED = 'resolved' //定义常量，存储成功状态字符
	const REJECTED = 'rejected' //定义常量，存储失败状态字符

	//Promise构造函数
	function Promise(excutor){
		const self = this //缓存this
		self.status = PENDING //初始化实例的状态
		self.data = undefined //初始化实例所保存的数据（可能是成功的value，或是失败的reason）
		self.callbacks = [] //用于保存一组一组的回调函数，
		/* 
			self.callbacks形如：[
														{onResolved:()=>{},onRejected:()=>{}},
														{onResolved:()=>{},onRejected:()=>{}}
													]
		*/

		//调用resolve会：1.内部状态改为resolved，2.保存成功的value，3.去callbacks中取出所有的onResolved依次异步调用
		function resolve(value){
			if(self.status !== PENDING) return
			//1.内部状态改为resolved
			self.status = RESOLVED
			//2.保存成功的value
			self.data = value
			//3.去callbacks中取出所有的onResolved依次异步调用
			setTimeout(()=>{
				self.callbacks.forEach((cbkObj)=>{
					cbkObj.onResolved(value)
				})
			})
		}

		//调用reject会：1.内部状态改为rejected，2.保存失败的reason，3.去callbacks中取出所有的onRejected依次异步调用
		function reject(reason){
			if(self.status !== PENDING) return
			//1.内部状态改为rejected
			self.status = REJECTED
			//2.保存失败的reason
			self.data = reason
			//3.去callbacks中取出所有的onRejected依次异步调用
			setTimeout(()=>{
				self.callbacks.forEach((cbkObj)=>{
					cbkObj.onRejected(reason)
				})
			})
		}

		excutor(resolve,reject)
	}

	/* 
		 一、then做什么？
					1.如果调用then的时候，Promise实例状态为resolved，去执行onResolved回调。
					2.如果调用then的时候，Promise实例状态为rejected，去执行onRejected回调。
					3.如果调用then的时候，Promise实例状态为pending，不去执行回调，去将onResolved和onRejected保存起来 
		 二、then的返回值是什么？
					返回的是Promise的实例对象，返回的这个Promise实例对象的状态、数据如何确定？
						1.如果then所指定的回调执行是抛出了异常，then返回的那个Promise实例状态为：rejected，reason是该异常
						2.如果then所指定的回调返回值是一个非Promise类型，then返回的那个Promise实例状态为：resolved，value是该返回值
						3.如果then所指定的回调返回值是一个Promise实例，then返回的那个Promise实例状态、数据与之一致。
	*/

	Promise.prototype.then = function(onResolved,onRejected){
		const self = this
		//下面这行代码，作用是：将错误的reason一层一层抛出
		onRejected = typeof onRejected === 'function' ? onRejected : reason => {throw(reason)}
		//下面这行代码，作用是：让catch具有传递功能
		onResolved = typeof onResolved === 'function' ? onResolved : value => value
		return new Promise((resolve,reject)=>{
			//专门用于执行onResolved,onRejected
			function handle (callback){
				try {
					let result = callback(self.data)
					if(!(result instanceof Promise)){
						//进入此判断，意味着：onResolved的返回值是一个，非Promise实例
						resolve(result)
					}else{
						//进入此else，意味着：onResolved的返回值是一个Promise实例
						result.then(
							value => resolve(value),
							reason => reject(reason)
						)
					}
				} catch (error) {
					reject(error)
				}
			}
			//1.如果调用then的时候，Promise实例状态为resolved，去执行onResolved回调。
			if(self.status === RESOLVED){
				setTimeout(()=>{
					handle(onResolved)
				})
			}
			//2.如果调用then的时候，Promise实例状态为rejected，去执行onRejected回调。
			else if(self.status === REJECTED){
				setTimeout(()=>{
					handle(onRejected)
				})
			}
			//3.如果调用then的时候，Promise实例状态为pending，不去执行回调，去将onResolved和onRejected保存起来 
			else{
				self.callbacks.push({
					onResolved:function(){
						handle(onResolved)
					},
					onRejected:function(){
						handle(onRejected)
					}
				})
			}
		})
	}

	Promise.prototype.catch = function(onRejected){
		return this.then(undefined,onRejected)
	}

	Promise.resolve = function(value){
		return new Promise((resolve,reject)=>{
			if(value instanceof Promise){
				value.then(
					val => resolve(val),
					reason => reject(reason)
				)
			}else{
				resolve(value)
			}
		})
	}

//替换掉window上的Promise
window.Promise = Promise
})()